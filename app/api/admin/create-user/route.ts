import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ============================================
// SUPABASE CLIENTS
// ============================================

// Admin client with service_role key (can bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Server client for current user verification (uses cookies)
function getSupabaseServerClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// ============================================
// POST /api/admin/create-user
// ============================================

export async function POST(request: Request) {
  try {
    // ──────────────────────────────────────────
    // 1. Verify Authentication
    // ──────────────────────────────────────────
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────
    // 2. Verify Admin Role
    // ──────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      console.warn(`⚠️ Unauthorized access attempt by user: ${user.email}`);
      return NextResponse.json(
        { error: 'Forbidden - Only active administrators can create users' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin verified: ${profile.name} (${user.email})`);

    // ──────────────────────────────────────────
    // 3. Parse & Validate Request Body
    // ──────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role, position, department } = body;

    // Required fields validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['email', 'password', 'name', 'role'],
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Role validation
    const validRoles = ['admin', 'manager', 'sales', 'support'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: 'Invalid role',
          validRoles,
        },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────
    // 4. Check for Existing User
    // ──────────────────────────────────────────
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.warn(`⚠️ Attempt to create duplicate user: ${email}`);
      return NextResponse.json(
        { error: `A user with email "${email}" already exists` },
        { status: 409 }
      );
    }

    console.log(`🔄 Creating new user: ${email} (${name})`);

    // ──────────────────────────────────────────
    // 5. Create Auth User
    // ──────────────────────────────────────────
    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role,
        },
      });

    if (authCreateError) {
      console.error('❌ Auth user creation error:', authCreateError);
      return NextResponse.json(
        {
          error: 'Failed to create authentication account',
          details: authCreateError.message,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation returned no data' },
        { status: 500 }
      );
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // ──────────────────────────────────────────
    // 6. Create User Profile
    // ──────────────────────────────────────────
    const { error: profileCreateError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role,
        position: position || null,
        department: department || null,
        created_by: user.id, // The admin who created this user
        is_active: true,
      });

    if (profileCreateError) {
      console.error('❌ Profile creation error:', profileCreateError);

      // Rollback: Delete auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('🔄 Rolled back auth user creation');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: profileCreateError.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ User profile created successfully`);

    // ──────────────────────────────────────────
    // 7. Success Response
    // ──────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email,
          name,
          role,
          created_at: authData.user.created_at,
        },
        message: `User "${name}" has been created successfully. They can now login with email: ${email}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // ──────────────────────────────────────────
    // Global Error Handler
    // ──────────────────────────────────────────
    console.error('❌ Unexpected error in create-user API:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONAL: GET endpoint for testing
// ============================================

export async function GET() {
  return NextResponse.json(
    {
      message: 'Admin Create User API',
      method: 'POST',
      requiredFields: ['email', 'password', 'name', 'role'],
      optionalFields: ['phone', 'position', 'department'],
      authentication: 'Required (Admin only)',
    },
    { status: 200 }
  );
}
