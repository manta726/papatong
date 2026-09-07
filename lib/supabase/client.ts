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
  budget: string | null;
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

// Keep existing types
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

  // Budget score (0-40)
  if (lead.budget && (lead.budget.toLowerCase().includes('confirm') || lead.budget.includes('jt'))) {
    score += 40;
  } else if (lead.budget) {
    score += 20;
  }

  // Timeline score (0-30)
  if (lead.status === 'qualified') {
    score += 30;
  } else if (lead.status === 'contacted') {
    score += 15;
  }

  // Engagement score (0-20)
  if (lead.contacted_at) {
    score += 20;
  }

  // Cap at 100
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
  // Insert follow-up log
  const { data, error } = await supabase
    .from('follow_up_logs')
    .insert({ ...followUp, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  // Update lead's last_follow_up_at and contacted_at
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
    { category: 'budget', criterion: 'Budget confirmed', points: 40 },
    { category: 'budget', criterion: 'Budget needs financing info', points: 20 },
    { category: 'timeline', criterion: 'Buying within 1 month', points: 30 },
    { category: 'timeline', criterion: 'Buying within 1-3 months', points: 15 },
    { category: 'engagement', criterion: 'Already visited/surveyed', points: 20 },
    { category: 'engagement', criterion: 'Asked detailed questions', points: 15 },
    { category: 'engagement', criterion: 'Just initial inquiry', points: 0 },
  ];

  for (const rule of defaultRules) {
    // Check if rule already exists
    const { data: existing } = await supabase
      .from('lead_score_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('criterion', rule.criterion)
      .single();

    // Only insert if doesn't exist
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
  // Get the lead
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Calculate new score
  const newScore = calculateLeadScore(lead as Lead);
  const newGrade = getLeadGrade(newScore);

  // Update lead
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
