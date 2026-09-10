// app/dashboard/leads/[id]/page.tsx - COLLABORATIVE VERSION
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  supabase,
  Lead,
  getLeadById,
  getFollowUpLogs,
  calculateLeadScore,
  getLeadGrade,
  getTeamMembers,
  TeamMember,
  assignLead,
  updateLead,
  FollowUpLog,
} from '@/lib/supabase/client';
import { formatRupiah, formatRupiahInput, parseBudget } from '@/lib/format';
import { LeadGradeBadge } from '@/components/leads/lead-grade-badge';
import { FollowUpForm } from '@/components/leads/follow-up-form';
import { FollowUpList } from '@/components/leads/follow-up-list';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Pencil, Save, X, Loader2, User, Edit3, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const leadSources = ['website', 'referral', 'social', 'walk-in', 'advertisement', 'other'];

export const dynamic = 'force-dynamic';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  // ✅ CHANGED: No user_id filter
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [leadData, followUpsData, team] = await Promise.all([
          getLeadById(params.id),
          getFollowUpLogs(params.id),
          getTeamMembers(),
        ]);

        setLead(leadData);
        setFollowUps(followUpsData);
        setTeamMembers(team);
        setForm(leadData);
      } catch (error) {
        toast({ title: 'Error loading lead', variant: 'destructive' });
        router.push('/dashboard/leads');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, user, toast, router]);

  // ✅ CHANGED: Use updateLead function
  const handleSave = async () => {
    if (!user || !lead) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        budget: form.budget ? parseBudget(form.budget.toString()) : null,
      };

      const updated = await updateLead(params.id, payload);
      setLead(updated);
      setEditing(false);
      toast({ title: 'Lead updated' });
    } catch (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  const score = calculateLeadScore(lead);
  const grade = getLeadGrade(score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/leads">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{lead.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <LeadGradeBadge grade={grade} />
            <StatusBadge status={lead.status} />
            <span className="text-sm text-muted-foreground">• {lead.source}</span>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Lead Info & Follow-up Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  {/* Edit form - SAME AS BEFORE */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={form.name ?? ''}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={form.status ?? 'new'}
                        onValueChange={(v) => setForm({ ...form, status: v })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={form.email ?? ''}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={form.phone ?? ''}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={form.source ?? 'website'}
                        onValueChange={(v) => setForm({ ...form, source: v })}
                      >
                        <SelectTrigger id="source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadSources.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget</Label>
                      <Input
                        id="budget"
                        value={formatRupiahInput(form.budget?.toString() ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '');
                          setForm({ ...form, budget: raw ? parseInt(raw, 10) : null });
                        }}
                        placeholder="Rp 0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_interest">Unit Interest</Label>
                    <Input
                      id="unit_interest"
                      value={form.unit_interest ?? ''}
                      onChange={(e) => setForm({ ...form, unit_interest: e.target.value })}
                      placeholder="e.g. Tipe A, 100m²"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={form.notes ?? ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {lead.email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {lead.phone || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-sm font-medium">{formatRupiah(lead.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit Interest</p>
                      <p className="text-sm font-medium">{lead.unit_interest || '—'}</p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Form */}
          {user && (
            <FollowUpForm
              leadId={params.id}
              userId={user.id}
              onSuccess={(log) => setFollowUps([log, ...followUps])}
            />
          )}
        </div>

        {/* Right: Assignment & Score */}
        <div className="space-y-6">
          {/* ✅ NEW: Audit Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="font-medium">{lead.creator_name || 'Unknown'}</p>
                  {lead.created_by === user?.id && (
                    <Badge variant="outline" className="mt-1 text-xs">You</Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              {lead.editor_name && lead.editor_name !== lead.creator_name && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <Edit3 className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Last Edited By</p>
                    <p className="font-medium">{lead.editor_name}</p>
                    {lead.edited_by === user?.id && (
                      <Badge variant="outline" className="mt-1 text-xs">You</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(lead.updated_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{score}</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    grade === 'HOT' ? 'bg-red-500' :
                    grade === 'WARM' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-center text-sm">
                Grade: <span className="font-semibold">{grade}</span>
              </p>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assign To</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={lead.assigned_to || ''}
                onValueChange={async (value) => {
                  try {
                    await assignLead(params.id, value || null);
                    setLead({ ...lead, assigned_to: value || null });
                    toast({ title: 'Lead assigned' });
                  } catch (error) {
                    toast({ title: 'Failed to assign', variant: 'destructive' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p>{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
              {lead.contacted_at && (
                <div>
                  <p className="text-xs text-muted-foreground">First Contact</p>
                  <p>{new Date(lead.contacted_at).toLocaleDateString()}</p>
                </div>
              )}
              {lead.last_follow_up_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Follow-up</p>
                  <p>{new Date(lead.last_follow_up_at).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up History</CardTitle>
          <CardDescription>{followUps.length} follow-ups logged</CardDescription>
        </CardHeader>
        <CardContent>
          <FollowUpList logs={followUps} />
        </CardContent>
      </Card>
    </div>
  );
}
