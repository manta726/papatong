'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
 
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ============= TYPE DEFINITIONS =============

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  unit_interest: string | null;
  budget: number | null;  // ✅ Diubah dari string ke number
  notes: string | null;
  user_id: string;

  // CRM Fields
  lead_score: number;
  lead_grade: 'HOT' | 'WARM' | 'COLD';
  assigned_to: string | null;
  contacted_at: string | null;
  last_follow_up_at: string | null;

  created_at: string;
  updated_at: string;
};

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
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  lead_id: string | null;
  unit_id: string | null;
  booking_date: string;
  status: string;
  amount: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  units?: Unit | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  related_lead_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
};

export type Expense = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// ============= UTILITY FUNCTIONS =============

/**
 * Calculate lead score based on current lead data
 * HOT: 70+, WARM: 40-69, COLD: 0-39
 */
export function calculateLeadScore(lead: Lead): number {
  let score = 0;

  // Budget score (0-40) - revisi untuk number
  if (lead.budget && lead.budget > 0) {
    if (lead.budget >= 1_000_000_000) score += 40;       // >= 1 Miliar
    else if (lead.budget >= 500_000_000) score += 30;    // >= 500jt
    else if (lead.budget >= 100_000_000) score += 20;    // >= 100jt
    else score += 10;                                     // < 100jt
  }

  // Status/Timeline score (0-30)
  if (lead.status === 'qualified') score += 30;
  else if (lead.status === 'contacted') score += 15;

  // Engagement score (0-20)
  if (lead.contacted_at) score += 20;

  // Unit interest bonus (0-10)
  if (lead.unit_interest && lead.unit_interest.trim() !== '') {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Get lead grade based on score
 * HOT: 70+, WARM: 40-69, COLD: 0-39
 */
export function getLeadGrade(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

/**
 * Get all follow-ups for a lead
 */
export async function getFollowUpLogs(leadId: string, userId: string) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('contact_date', { ascending: false });

  if (error) throw error;
  return (data as FollowUpLog[]) || [];
}

/**
 * Add a new follow-up log
 */
export async function addFollowUpLog(
  followUp: Omit<FollowUpLog, 'id' | 'created_at'>,
  userId: string
) {
  const { data, error } = await supabase
    .from('follow_up_logs')
    .insert({ ...followUp, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('leads')
    .update({
      last_follow_up_at: new Date().toISOString(),
      contacted_at: followUp.contact_date,
    })
    .eq('id', followUp.lead_id)
    .eq('user_id', userId);

  return data as FollowUpLog;
}

/**
 * Get all team members
 */
export async function getTeamMembers(userId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return (data as TeamMember[]) || [];
}

/**
 * Add team member
 */
export async function addTeamMember(
  member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>,
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

/**
 * Assign lead to team member
 */
export async function assignLead(leadId: string, assignedTo: string | null, userId: string) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .eq('id', leadId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get lead with follow-ups
 */
export async function getLeadWithFollowUps(leadId: string, userId: string) {
  const [leadResult, followUpsResult] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
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

/**
 * Initialize default scoring rules for new user
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
export async function updateLeadScore(leadId: string, userId: string) {
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('user_id', userId)
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
    .eq('id', leadId)
    .eq('user_id', userId);

  if (updateError) throw updateError;
}
