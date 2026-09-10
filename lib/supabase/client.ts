// lib/supabase/client.ts - COLLABORATIVE CRM VERSION
'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ============= TYPE DEFINITIONS =============

/**
 * USER PROFILE
 */
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

/**
 * LEAD - With audit trail
 */
export type Lead = {
  id: string;
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

  // Audit fields (auto-populated by triggers)
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;

  created_at: string;
  updated_at: string;
};

/**
 * FOLLOW UP LOG
 */
export type FollowUpLog = {
  id: string;
  lead_id: string;
  user_id: string;
  contact_date: string;
  contact_method: 'call' | 'whatsapp' | 'email' | 'visit';
  outcome: 'interested' | 'not_interested' | 'need_info' | 'agreed_survey' | 'survey_done' | 'agreed_booking';
  notes: string | null;
  next_follow_up_date: string | null;
  next_action: 'call' | 'send_info' | 'schedule_survey' | 'send_proposal' | 'close' | null;
  user_role: string | null;
  user_name: string | null;
  created_at: string;
};

/**
 * TEAM MEMBER
 */
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

/**
 * LEAD SCORE RULE
 */
export type LeadScoreRule = {
  id: string;
  user_id: string;
  category: string;
  criterion: string;
  points: number;
  active: boolean;
  created_at: string;
};

/**
 * UNIT - With audit trail
 */
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
  created_at: string;
  updated_at: string;
};

/**
 * BOOKING - With audit trail
 */
export type Booking = {
  id: string;
  lead_id: string | null;
  unit_id: string | null;
  booking_date: string;
  status: string;
  amount: number;
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  units?: Unit | null;
};

/**
 * TASK - With audit trail
 */
export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_lead_id: string | null;
  created_by: string | null;
  edited_by: string | null;
  creator_name: string | null;
  editor_name: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
};

/**
 * EXPENSE - With audit trail
 */
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

// ============= LEAD SCORING FUNCTIONS =============

/**
 * Calculate lead score (0-100)
 */
export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0;

  if (lead.budget && lead.budget > 0) {
    if (lead.budget >= 1_000_000_000) score += 40;
    else if (lead.budget >= 500_000_000) score += 30;
    else if (lead.budget >= 100_000_000) score += 20;
    else score += 10;
  }

  if (lead.status === 'qualified') score += 30;
  else if (lead.status === 'contacted') score += 15;
  else if (lead.status === 'new') score += 5;

  if (lead.contacted_at) score += 20;

  if (lead.unit_interest && lead.unit_interest.trim() !== '') {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Get lead grade based on score
 */
export function getLeadGrade(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

// ============= COLLABORATIVE DATA FETCHING =============

/**
 * Get ALL leads (all users can see all leads)
 */
export async function getAllLeads(filters?: { 
  status?: string; 
  assignedTo?: string; 
  createdBy?: string;
}) {
  let query = supabase
    .from('leads')
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
 * Get single lead by ID (no user_id filter)
 */
export async function getLeadById(leadId: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Get all follow-ups for a lead (collaborative)
 */
export async function getFollowUpLogs(leadId: string) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('contact_date', { ascending: false });

  if (error) throw error;
  return (data as FollowUpLog[]) || [];
}

/**
 * Add follow-up log (collaborative)
 */
export async function addFollowUpLog(
  followUp: Omit<FollowUpLog, 'id' | 'created_at' | 'user_role' | 'user_name'>,
  userId: string
) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .insert({ ...followUp, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  // Update lead's last_follow_up_at
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
 * Get lead with follow-ups (no user_id filter)
 */
export async function getLeadWithFollowUps(leadId: string) {
  const [leadResult, followUpsResult] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single(),
    supabase
      .from('follow_up_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('contact_date', { ascending: false }),
  ]);

  if (leadResult.error) throw leadResult.error;

  return {
    lead: leadResult.data as Lead,
    followUps: (followUpsResult.data as FollowUpLog[]) || [],
  };
}

// ============= CRUD OPERATIONS =============

/**
 * Create new lead - audit fields auto-populated
 */
export async function createLead(
  leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'lead_grade' | 'created_by' | 'edited_by' | 'creator_name' | 'editor_name'>
) {
  const score = calculateLeadScore(leadData);
  const grade = getLeadGrade(score);

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      lead_score: score,
      lead_grade: grade,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Update lead - audit fields auto-updated
 */
export async function updateLead(leadId: string, updates: Partial<Lead>) {
  // Recalculate score if needed
  if (updates.budget !== undefined || updates.status !== undefined || 
      updates.contacted_at !== undefined || updates.unit_interest !== undefined) {
    const { data: current } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (current) {
      const merged = { ...current, ...updates };
      updates.lead_score = calculateLeadScore(merged);
      updates.lead_grade = getLeadGrade(updates.lead_score);
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Delete lead
 */
export async function deleteLead(leadId: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) throw error;
}

/**
 * Assign lead to user
 */
export async function assignLead(leadId: string, assignedTo: string | null) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .eq('id', leadId);

  if (error) throw error;
}

// ============= TEAM MEMBERS (COLLABORATIVE) =============

/**
 * Get all team members (all users can see)
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

/**
 * Add team member
 */
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

// ============= USER PROFILES =============

/**
 * Get all user profiles
 */
export async function getAllUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data as UserProfile[]) || [];
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ============= OTHER ENTITIES (COLLABORATIVE) =============

/**
 * Get all bookings
 */
export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      leads:lead_id(*),
      units:unit_id(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Booking[]) || [];
}

/**
 * Get all units
 */
export async function getAllUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Unit[]) || [];
}

/**
 * Get all tasks
 */
export async function getAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      leads:related_lead_id(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Task[]) || [];
}

/**
 * Get all expenses
 */
export async function getAllExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as Expense[]) || [];
}

// ============= LEGACY FUNCTIONS (kept for compatibility) =============

/**
 * Get lead score rules
 */
export async function getLeadScoreRules(userId: string) {
  const { data, error } = await supabase
    .from('lead_score_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('points', { ascending: false });

  if (error) throw error;
  return (data as LeadScoreRule[]) || [];
}

/**
 * Initialize default scoring rules
 */
export async function initializeDefaultScoringRules(userId: string) {
  const defaultRules = [
    { category: 'budget', criterion: 'Budget > 1 Miliar', points: 40 },
    { category: 'budget', criterion: 'Budget 500jt - 1M', points: 30 },
    { category: 'budget', criterion: 'Budget 100jt - 500jt', points: 20 },
    { category: 'budget', criterion: 'Budget < 100jt', points: 10 },
    { category: 'timeline', criterion: 'Status qualified', points: 30 },
    { category: 'timeline', criterion: 'Status contacted', points: 15 },
    { category: 'engagement', criterion: 'Sudah dihubungi', points: 20 },
    { category: 'engagement', criterion: 'Ada unit interest', points: 10 },
  ];

  for (const rule of defaultRules) {
    const { data: existing } = await supabase
      .from('lead_score_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('criterion', rule.criterion)
      .single();

    if (!existing) {
      await supabase
        .from('lead_score_rules')
        .insert({
          user_id: userId,
          ...rule,
          active: true,
        });
    }
  }
}

/**
 * Update lead score and grade
 */
export async function updateLeadScore(leadId: string) {
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (fetchError) throw fetchError;

  const newScore = calculateLeadScore(lead as Lead);
  const newGrade = getLeadGrade(newScore);

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      lead_score: newScore,
      lead_grade: newGrade,
    })
    .eq('id', leadId);

  if (updateError) throw updateError;
}
