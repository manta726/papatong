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
// TYPE DEFINITIONS (SINGLE - NO DUPLICATES)
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
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  unit_interest: string | null;
  budget: number | null;
  notes: string | null;
  lead_score: number;
  lead_grade: 'HOT' | 'WARM' | 'COLD';
  assigned_to: string | null;
  contacted_at: string | null;
  last_follow_up_at: string | null;
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  creator_display_name?: string | null;
  creator_role?: string | null;
  assignee_display_name?: string | null;
  assignee_phone?: string | null;
};

// ✅ FOLLOW UP LOG - With Audit Trail (FIXED - single declaration)
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
  
  // Creator info
  user_role: string | null;
  user_name: string | null;
  
  // ✅ NEW: Editor audit trail
  edited_by: string | null;
  edited_at: string | null;
  editor_name: string | null;
  editor_role: string | null;
  
  deleted_at: string | null;
  created_at: string;
};

export type TeamMember = {
  id: string;
  user_id: string;
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

// ✅ BOOKING - With Payment Method (FIXED - single declaration)
export type Booking = {
  id: string;
  user_id: string;
  lead_id: string | null;
  unit_id: string | null;
  booking_date: string;
  status: string;
  amount: number;
  notes: string | null;
  booking_number: string | null;
  
  // ✅ NEW: Payment info
  payment_method: string | null;
  payment_details: string | null;
  
  // Audit fields
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  units?: Unit | null;
};

// ✅ TASK - With Assigned To & Recurring (FIXED - single declaration)
export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_lead_id: string | null;
  
  // ✅ NEW: Assignment
  assigned_to: string | null;
  assigned_to_name: string | null;
  
  // ✅ NEW: Recurring
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  parent_task_id: string | null;
  
  // Audit fields
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
};

// ✅ EXPENSE - With Receipt & Approval (FIXED - single declaration)
export type Expense = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  date: string;
  
  // ✅ NEW: Receipt & approval
  receipt_url: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  approver_name: string | null;
  rejection_reason: string | null;
  
  // Audit fields
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
// HELPER TYPES
// ============================================

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'kpr' | 'installment' | 'other';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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

export async function getAllLeads(filters?: {
  status?: string;
  assignedTo?: string;
  createdBy?: string;
}) {
  let query = supabase
    .from('active_leads')
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

export async function getLeadById(leadId: string) {
  const { data, error } = await supabase
    .from('active_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function createLead(
  leadData: {
    name: string;
    source: string;
    status: string;
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
      email:              leadData.email ?? null,
      phone:              leadData.phone ?? null,
      unit_interest:      leadData.unit_interest ?? null,
      budget:             leadData.budget ?? null,
      notes:              leadData.notes ?? null,
      assigned_to:        leadData.assigned_to ?? null,
      contacted_at:       leadData.contacted_at ?? null,
      last_follow_up_at:  leadData.last_follow_up_at ?? null,
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

export async function updateLead(leadId: string, updates: Partial<Lead>) {
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

  const {
    creator_display_name,
    creator_role,
    assignee_display_name,
    assignee_phone,
    deleted_at,
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

export async function assignLead(leadId: string, assignedTo: string | null) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .eq('id', leadId);

  if (error) throw error;
}
// ============================================
// FOLLOW UP LOGS - COLLABORATIVE (UPDATED - 1 argument)
// ============================================

export async function getFollowUpLogs(leadId: string) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('lead_id', leadId)
    .is('deleted_at', null)
    .order('contact_date', { ascending: false });

  if (error) throw error;
  return (data as FollowUpLog[]) || [];
}

// ✅ FIXED: 1 argument, user_id inside object
export async function addFollowUpLog(
  followUp: {
    lead_id: string;
    contact_date: string;
    contact_method: 'call' | 'whatsapp' | 'email' | 'visit';
    outcome:
      | 'interested'
      | 'not_interested'
      | 'need_info'
      | 'agreed_survey'
      | 'survey_done'
      | 'agreed_booking';
    notes?: string | null;
    next_follow_up_date?: string | null;
    next_action?:
      | 'call'
      | 'send_info'
      | 'schedule_survey'
      | 'send_proposal'
      | 'close'
      | null;
    user_id?: string; // Optional, fallback to auth.uid()
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('follow_up_logs')
    .insert({
      ...followUp,
      notes: followUp.notes ?? null,
      next_follow_up_date: followUp.next_follow_up_date ?? null,
      next_action: followUp.next_action ?? null,
      user_id: followUp.user_id ?? user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Update lead's last_follow_up_at & contacted_at
  await supabase
    .from('leads')
    .update({
      last_follow_up_at: new Date().toISOString(),
      contacted_at: followUp.contact_date,
    })
    .eq('id', followUp.lead_id);

  return data as FollowUpLog;
}

export async function updateFollowUpLog(
  logId: string,
  updates: {
    contact_date?: string;
    contact_method?: 'call' | 'whatsapp' | 'email' | 'visit';
    outcome?:
      | 'interested'
      | 'not_interested'
      | 'need_info'
      | 'agreed_survey'
      | 'survey_done'
      | 'agreed_booking';
    notes?: string | null;
    next_follow_up_date?: string | null;
    next_action?:
      | 'call'
      | 'send_info'
      | 'schedule_survey'
      | 'send_proposal'
      | 'close'
      | null;
  }
) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return data as FollowUpLog;
}

export async function deleteFollowUpLog(
  logId: string
): Promise<SoftDeleteResult> {
  const { data, error } = await supabase
    .rpc('soft_delete', {
      p_table: 'follow_up_logs',
      p_id: logId,
    });

  if (error) throw error;

  const result = data as SoftDeleteResult;
  if (!result.success) {
    throw new Error(result.error || 'Delete gagal');
  }

  return result;
}
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
  bookingData: {
    lead_id: string | null;
    unit_id: string | null;
    booking_date: string;
    status: string;
    amount: number;
    notes?: string | null;
    booking_number?: string | null;
    payment_method?: string | null;
    payment_details?: string | null;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      notes: bookingData.notes ?? null,
      booking_number: bookingData.booking_number ?? null,
      payment_method: bookingData.payment_method ?? null,
      payment_details: bookingData.payment_details ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>) {
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
// TASKS - COLLABORATIVE (UPDATED)
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
  taskData: {
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    due_date?: string | null;
    related_lead_id?: string | null;
    
    // ✅ NEW: Assignment
    assigned_to?: string | null;
    
    // ✅ NEW: Recurring
    is_recurring?: boolean;
    recurrence_pattern?: string | null;
    recurrence_end_date?: string | null;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description ?? null,
      status: taskData.status ?? 'todo',
      priority: taskData.priority ?? 'medium',
      due_date: taskData.due_date ?? null,
      related_lead_id: taskData.related_lead_id ?? null,
      assigned_to: taskData.assigned_to ?? null,
      is_recurring: taskData.is_recurring ?? false,
      recurrence_pattern: taskData.recurrence_pattern ?? null,
      recurrence_end_date: taskData.recurrence_end_date ?? null,
      user_id: user.id,
      // assigned_to_name akan auto-fill oleh trigger
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { 
    leads, 
    deleted_at, 
    creator_name,
    editor_name,
    assigned_to_name, // Jangan update manual, auto-fill oleh trigger
    ...safeUpdates 
  } = updates;

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

/**
 * ✅ NEW: Update task status only (untuk assignee yang bukan creator)
 */
export async function updateTaskStatus(taskId: string, newStatus: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

// ============================================
// EXPENSES - COLLABORATIVE (UPDATED)
// ============================================

export async function getAllExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as Expense[]) || [];
}

export async function createExpense(
  expenseData: {
    title: string;
    description?: string | null;
    category: string;
    amount: number;
    date: string;
    receipt_url?: string | null;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User tidak terautentikasi');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      title: expenseData.title,
      description: expenseData.description ?? null,
      category: expenseData.category,
      amount: expenseData.amount,
      date: expenseData.date,
      receipt_url: expenseData.receipt_url ?? null,
      user_id: user.id,
      // approval_status, approved_by, approver_name
      // akan auto-set oleh trigger auto_approve_admin
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(expenseId: string, updates: Partial<Expense>) {
  const { 
    creator_name,
    editor_name,
    approver_name,
    approval_status,
    approved_by,
    approved_at,
    ...safeUpdates 
  } = updates;

  const { data, error } = await supabase
    .from('expenses')
    .update(safeUpdates)
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

/**
 * ✅ NEW: Approve expense (admin/manager only)
 */
export async function approveExpense(expenseId: string, approverId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      approval_status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

/**
 * ✅ NEW: Reject expense (admin/manager only)
 */
export async function rejectExpense(expenseId: string, approverId: string, reason: string) {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      approval_status: 'rejected',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) throw error;
}

// ============================================
// HISTORY & AUDIT
// ============================================

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

export async function getRecentActivity(limit = 20) {
  const { data, error } = await supabase
    .from('recent_activity')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getDeletedRecords() {
  const { data, error } = await supabase
    .from('deleted_records')
    .select('*')
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

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
