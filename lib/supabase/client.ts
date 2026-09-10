// lib/supabase/client.ts - COLLABORATIVE CRM VERSION (FIXED)
'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPE DEFINITIONS
// ============================================

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'sales' | 'support';
  position: string | null;
  department: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  user_id: string;           // kolom lama, tetap ada
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  unit_interest: string | null;
  budget: number | null;
  notes: string | null;

  // CRM fields
  lead_score: number;
  lead_grade: 'HOT' | 'WARM' | 'COLD';
  assigned_to: string | null;
  contacted_at: string | null;
  last_follow_up_at: string | null;

  // Audit fields (auto by triggers)
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;

  // Soft delete
  deleted_at: string | null;

  created_at: string;
  updated_at: string;

  // Join fields (dari view active_leads)
  creator_display_name?: string | null;
  creator_role?: string | null;
  assignee_display_name?: string | null;
  assignee_phone?: string | null;
};

export type FollowUpLog = {
  id: string;
  lead_id: string;
  user_id: string;
  contact_date: string;
  contact_method: 'call' | 'whatsapp' | 'email' | 'visit';
  outcome:
    | 'interested'
    | 'not_interested'
    | 'need_info'
    | 'agreed_survey'
    | 'survey_done'
    | 'agreed_booking';
  notes: string | null;
  next_follow_up_date: string | null;
  next_action:
    | 'call'
    | 'send_info'
    | 'schedule_survey'
    | 'send_proposal'
    | 'close'
    | null;
  user_role: string | null;
  user_name: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type TeamMember = {
  id: string;
  user_id: string;   // ← ini auth.users.id, dipakai untuk assigned_to
  name: string;
  email: string | null;
  phone: string | null;
  role: 'in_house' | 'admin' | 'manager';
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadScoreRule = {
  id: string;
  user_id: string;
  category: string;
  criterion: string;
  points: number;
  active: boolean;
  created_at: string;
};

export type Unit = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  price: number;
  location: string | null;
  description: string | null;
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  user_id: string;          // kolom lama
  lead_id: string | null;
  unit_id: string | null;
  booking_date: string;
  status: string;
  amount: number;
  notes: string | null;
  booking_number: string | null;

  // Audit fields
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  leads?: Lead | null;
  units?: Unit | null;
};

export type Task = {
  id: string;
  user_id: string;          // kolom lama
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_lead_id: string | null;

  // Audit fields
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  leads?: Lead | null;
};

export type Expense = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  date: string;
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  created_at: string;
  updated_at: string;
};

// Untuk soft delete response dari RPC
export type SoftDeleteResult = {
  success: boolean;
  message?: string;
  error?: string;
  record_id?: string;
  deleted_at?: string;
};

// ============================================
// LEAD SCORING
// ============================================

export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0;

  // Budget score (max 40)
  if (lead.budget && lead.budget > 0) {
    if (lead.budget >= 1_000_000_000) score += 40;
    else if (lead.budget >= 500_000_000) score += 30;
    else if (lead.budget >= 100_000_000) score += 20;
    else score += 10;
  }

  // Status score (max 30)
  if (lead.status === 'qualified') score += 30;
  else if (lead.status === 'contacted') score += 15;
  else if (lead.status === 'new') score += 5;

  // Contacted score (max 20)
  if (lead.contacted_at) score += 20;

  // Unit interest score (max 10)
  if (lead.unit_interest && lead.unit_interest.trim() !== '') {
    score += 10;
  }

  return Math.min(score, 100);
}

export function getLeadGrade(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

// ============================================
// LEADS - COLLABORATIVE
// ============================================

/**
 * Get ALL leads (semua user bisa lihat semua lead)
 * Pakai view active_leads yang sudah include join user_profiles
 * Otomatis filter deleted_at IS NULL via view
 */
export async function getAllLeads(filters?: {
  status?: string;
  assignedTo?: string;
  createdBy?: string;
}) {
  let query = supabase
    .from('active_leads')   // ← pakai VIEW, bukan table langsung
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Lead[]) || [];
}

/**
 * Get single lead by ID
 * Tetap filter deleted_at IS NULL via RLS policy
 */
export async function getLeadById(leadId: string) {
  const { data, error } = await supabase
    .from('active_leads')   // ← pakai VIEW
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Create lead baru
 * created_by, creator_name → diisi otomatis oleh trigger set_audit_fields()
 * Tidak perlu pass user_id manual
 */
export async function createLead(
  leadData: {
    // Wajib diisi
    name: string;
    source: string;
    status: string;
    // Optional
    email?: string | null;
    phone?: string | null;
    unit_interest?: string | null;
    budget?: number | null;
    notes?: string | null;
    assigned_to?: string | null;
    contacted_at?: string | null;
    last_follow_up_at?: string | null;
  }
) {
  const score = calculateLeadScore(leadData);
  const grade = getLeadGrade(score);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('leads')
    .insert({
      // Default semua optional field ke null jika tidak diisi
      email:              leadData.email ?? null,
      phone:              leadData.phone ?? null,
      unit_interest:      leadData.unit_interest ?? null,
      budget:             leadData.budget ?? null,
      notes:              leadData.notes ?? null,
      assigned_to:        leadData.assigned_to ?? null,
      contacted_at:       leadData.contacted_at ?? null,
      last_follow_up_at:  leadData.last_follow_up_at ?? null,
      // Selalu diisi
      name:               leadData.name,
      source:             leadData.source,
      status:             leadData.status,
      user_id:            user.id,
      lead_score:         score,
      lead_grade:         grade,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Update lead
 * edited_by, editor_name → diisi otomatis oleh trigger set_edited_by()
 */
export async function updateLead(leadId: string, updates: Partial<Lead>) {
  // Recalculate score jika field relevan berubah
  const needsRecalc =
    updates.budget !== undefined ||
    updates.status !== undefined ||
    updates.contacted_at !== undefined ||
    updates.unit_interest !== undefined;

  if (needsRecalc) {
    const { data: current } = await supabase
      .from('leads')
      .select('budget, status, contacted_at, unit_interest')
      .eq('id', leadId)
      .single();

    if (current) {
      const merged = { ...current, ...updates };
      updates.lead_score = calculateLeadScore(merged);
      updates.lead_grade = getLeadGrade(updates.lead_score);
    }
  }

  // Hapus field view-only agar tidak error saat update
  const {
    creator_display_name,
    creator_role,
    assignee_display_name,
    assignee_phone,
    deleted_at,    // jangan update deleted_at manual, pakai soft_delete()
    ...safeUpdates
  } = updates;

  const { data, error } = await supabase
    .from('leads')
    .update(safeUpdates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Soft delete lead via RPC
 * Data tidak hilang, bisa di-restore oleh admin/manager
 */
export async function deleteLead(leadId: string): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('soft_delete', {
      p_table: 'leads',
      p_id: leadId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) {
    throw new Error(result.error || 'Soft delete gagal');
  }

  return result;
}

/**
 * Restore lead yang sudah di-soft-delete (admin/manager only)
 */
export async function restoreLead(leadId: string): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('restore_record', {
      p_table: 'leads',
      p_id: leadId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) {
    throw new Error(result.error || 'Restore gagal');
  }

  return result;
}

/**
 * Assign lead ke team member
 * PENTING: value adalah user_id dari team_members (auth.users.id)
 * bukan team_members.id
 */
export async function assignLead(leadId: string, assignedTo: string | null) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .eq('id', leadId);

  if (error) throw error;
}

// ============================================
// FOLLOW UP LOGS - COLLABORATIVE
// ============================================

/**
 * Get semua follow-up untuk lead tertentu
 * Semua user bisa lihat (via RLS policy follow_up_select)
 */
export async function getFollowUpLogs(leadId: string) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('lead_id', leadId)
    .is('deleted_at', null)          // filter soft delete
    .order('contact_date', { ascending: false });

  if (error) throw error;
  return (data as FollowUpLog[]) || [];
}

/**
 * Tambah follow-up log
 * user_id harus = auth.uid() (dicek via RLS policy follow_up_insert)
 */
export async function addFollowUpLog(
  followUp: Omit<FollowUpLog, 'id' | 'created_at' | 'user_role' | 'user_name' | 'deleted_at'>,
  userId: string
) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .insert({
      ...followUp,
      user_id: userId,    // harus sama dengan auth.uid()
    })
    .select()
    .single();

  if (error) throw error;

  // Update lead's last_follow_up_at dan contacted_at
  await supabase
    .from('leads')
    .update({
      last_follow_up_at: new Date().toISOString(),
      contacted_at: followUp.contact_date,
    })
    .eq('id', followUp.lead_id);

  return data as FollowUpLog;
}

/**
 * Get lead + follow-ups sekaligus
 */
export async function getLeadWithFollowUps(leadId: string) {
  const [leadResult, followUpsResult] = await Promise.all([
    supabase
      .from('active_leads')
      .select('*')
      .eq('id', leadId)
      .single(),
    supabase
      .from('follow_up_logs')
      .select('*')
      .eq('lead_id', leadId)
      .is('deleted_at', null)
      .order('contact_date', { ascending: false }),
  ]);

  if (leadResult.error) throw leadResult.error;

  return {
    lead: leadResult.data as Lead,
    followUps: (followUpsResult.data as FollowUpLog[]) || [],
  };
}

// ============================================
// TEAM MEMBERS
// ============================================

/**
 * Get semua team member aktif
 * PENTING untuk AssignLead: gunakan member.user_id (bukan member.id)
 * sebagai value di Select component
 */
export async function getTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return (data as TeamMember[]) || [];
}

export async function addTeamMember(
  member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  userId: string
) {
  const { data, error } = await supabase
    .from('team_members')
    .insert({ ...member, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
}

// ============================================
// USER PROFILES
// ============================================

export async function getAllUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data as UserProfile[]) || [];
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ============================================
// BOOKINGS - COLLABORATIVE
// ============================================

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      leads:lead_id(*),
      units:unit_id(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Booking[]) || [];
}

export async function createBooking(
  bookingData: Omit<
    Booking,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'created_by'
    | 'edited_by'
    | 'creator_name'
    | 'editor_name'
    | 'deleted_at'
    | 'leads'
    | 'units'
  >
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>) {
  // Hapus field relasi agar tidak error
  const { leads, units, deleted_at, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('bookings')
    .update(safeUpdates)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function deleteBooking(bookingId: string): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('soft_delete', {
      p_table: 'bookings',
      p_id: bookingId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) throw new Error(result.error || 'Delete gagal');
  return result;
}

// ============================================
// UNITS - COLLABORATIVE
// ============================================

export async function getAllUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Unit[]) || [];
}

// ============================================
// TASKS - COLLABORATIVE
// ============================================

export async function getAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      leads:related_lead_id(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Task[]) || [];
}

export async function createTask(
  taskData: Omit<
    Task,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'created_by'
    | 'edited_by'
    | 'creator_name'
    | 'editor_name'
    | 'deleted_at'
    | 'leads'
  >
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { leads, deleted_at, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('tasks')
    .update(safeUpdates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('soft_delete', {
      p_table: 'tasks',
      p_id: taskId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) throw new Error(result.error || 'Delete gagal');
  return result;
}

// ============================================
// EXPENSES - COLLABORATIVE
// ============================================

export async function getAllExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as Expense[]) || [];
}

// ============================================
// HISTORY & AUDIT
// ============================================

/**
 * Get history perubahan untuk satu record
 */
export async function getRecordHistory(
  tableName: string,
  recordId: string
) {
  const { data, error } = await supabase
    .from('data_history')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get recent activity untuk dashboard
 */
export async function getRecentActivity(limit = 20) {
  const { data, error } = await supabase
    .from('recent_activity')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get recycle bin (data yang di-soft-delete)
 */
export async function getDeletedRecords() {
  const { data, error } = await supabase
    .from('deleted_records')
    .select('*')
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Restore record dari recycle bin (admin/manager only)
 */
export async function restoreRecord(
  tableName: string,
  recordId: string
): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('restore_record', {
      p_table: tableName,
      p_id: recordId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) throw new Error(result.error || 'Restore gagal');
  return result;
}

// ============================================
// LEAD SCORE RULES (Admin/Manager)
// ============================================

/**
 * Get lead score rules (semua user bisa lihat, bukan hanya milik sendiri)
 */
export async function getLeadScoreRules() {
  const { data, error } = await supabase
    .from('lead_score_rules')
    .select('*')
    .eq('active', true)
    .order('points', { ascending: false });

  if (error) throw error;
  return (data as LeadScoreRule[]) || [];
}

export async function updateLeadScore(leadId: string) {
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('budget, status, contacted_at, unit_interest')
    .eq('id', leadId)
    .single();

  if (fetchError) throw fetchError;

  const newScore = calculateLeadScore(lead as Lead);
  const newGrade = getLeadGrade(newScore);

  const { error: updateError } = await supabase
    .from('leads')
    .update({ lead_score: newScore, lead_grade: newGrade })
    .eq('id', leadId);

  if (updateError) throw updateError;
}
