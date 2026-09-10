import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Supabase Admin Client (service_role key)
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

export async function POST(request: Request) {
  try {
    // 1. Verify current user is authenticated
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active, name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      return NextResponse.json(
        { error: 'Forbidden - Only administrators can create users' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin verified: ${profile.name} (${user.email})`);

    // 3. Get form data
    const body = await request.json();
    const { email, password, name, phone, role, position, department } = body;

    // 4. Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'sales', 'support'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    console.log(`🔄 Creating user: ${email} (${name})`);

    // 6. Create auth user with admin client
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          name,
          role,
        },
      });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create authentication account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // 7. Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role,
        position: position || null,
        department: department || null,
        created_by: user.id, // Admin's ID
        is_active: true,
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);

      // Rollback: delete auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('🔄 Auth user deleted (rollback)');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        { error: profileError.message || 'Failed to create user profile' },
        { status: 500 }
      );
    }

    console.log(`✅ User profile created successfully`);

    // 8. Log activity (optional)
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'create_user',
      description: `Admin ${profile.name} created new user: ${name} (${email})`,
      metadata: {
        new_user_id: authData.user.id,
        new_user_email: email,
        new_user_role: role,
      },
    }).catch(err => console.warn('Activity log failed:', err));

    // 9. Success response
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role,
        created_at: authData.user.created_at,
      },
      message: `User ${name} created successfully. They can now login with email: ${email}`,
    });

  } catch (error: any) {
    console.error('❌ Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
