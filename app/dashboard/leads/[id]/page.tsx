// app/dashboard/leads/[id]/page.tsx - FIXED
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Lead,
  getLeadById,
  getFollowUpLogs,
  calculateLeadScore,
  getLeadGrade,
  getTeamMembers,
  TeamMember,
  assignLead,
  updateLead,
  deleteLead,
  FollowUpLog,
} from '@/lib/supabase/client';
import { formatRupiah, formatRupiahInput, parseBudget } from '@/lib/format';
import { LeadGradeBadge } from '@/components/leads/lead-grade-badge';
import { FollowUpForm } from '@/components/leads/follow-up-form';
import { FollowUpList } from '@/components/leads/follow-up-list';
import { StatusBadge } from '@/components/leads/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Save,
  X,
  Loader2,
  User,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const leadSources = [
  'website',
  'referral',
  'social',
  'walk-in',
  'advertisement',
  'other',
];

export const dynamic = 'force-dynamic';

export default function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = useAuth(); // ✅ ambil profile untuk role check
  const { toast } = useToast();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  // ✅ Role-based permission checks
  const isAdminOrManager =
    profile?.role === 'admin' || profile?.role === 'manager';

  const canEdit =
    lead !== null &&
    (lead.created_by === user?.id ||
      lead.user_id === user?.id ||
      lead.assigned_to === user?.id ||
      isAdminOrManager);

  const canDelete =
    lead !== null &&
    (lead.created_by === user?.id ||
      lead.user_id === user?.id ||
      profile?.role === 'admin');

  // ============================================
  // DATA FETCHING
  // ============================================

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
        toast({
          title: 'Error loading lead',
          description:
            error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        router.push('/dashboard/leads');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, user, toast, router]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSave = async () => {
    if (!user || !lead) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        budget: form.budget
          ? parseBudget(form.budget.toString())
          : null,
      };

      const updated = await updateLead(params.id, payload);
      setLead(updated);
      setForm(updated); // ✅ reset form ke data terbaru
      setEditing(false);
      toast({ title: '✅ Lead updated successfully' });
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: reset form ke data asli jika cancel
  const handleCancelEdit = () => {
    setForm(lead || {});
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!lead) return;
    setDeleting(true);

    try {
      const result = await deleteLead(params.id); // ✅ soft delete via RPC
      toast({
        title: '🗑️ Lead deleted',
        description: 'Lead dipindahkan ke recycle bin',
      });
      router.push('/dashboard/leads');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description:
          error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAssign = async (value: string) => {
    if (!lead) return;

    // ✅ FIX: 'unassigned' = null, selainnya = user_id langsung
    const assignedTo = value === 'unassigned' ? null : value;

    try {
      await assignLead(params.id, assignedTo);
      setLead({ ...lead, assigned_to: assignedTo });
      toast({ title: '✅ Lead assigned' });
    } catch (error) {
      toast({
        title: 'Failed to assign',
        description:
          error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================

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
      {/* ── Header ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/leads">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">{lead.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <LeadGradeBadge grade={grade} />
            <StatusBadge status={lead.status} />
            <span className="text-sm text-muted-foreground capitalize">
              • {lead.source}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Edit / Save / Cancel — hanya tampil jika canEdit */}
          {canEdit && (
            editing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )
          )}

          {/* ✅ Delete button — hanya tampil jika canDelete */}
          {canDelete && !editing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Lead <strong>{lead.name}</strong> akan dipindahkan
                    ke recycle bin. Admin/manager dapat merestore data
                    ini jika diperlukan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Lead Info + Follow-up Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                /* ─── EDIT MODE ─── */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={form.name ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={form.status ?? 'new'}
                        onValueChange={(v) =>
                          setForm({ ...form, status: v })
                        }
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
                        type="email"
                        value={form.email ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={form.phone ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={form.source ?? 'website'}
                        onValueChange={(v) =>
                          setForm({ ...form, source: v })
                        }
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
                        value={formatRupiahInput(
                          form.budget?.toString() ?? ''
                        )}
                        onChange={(e) => {
                          const raw = e.target.value.replace(
                            /[^\d]/g,
                            ''
                          );
                          setForm({
                            ...form,
                            budget: raw ? parseInt(raw, 10) : null,
                          });
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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unit_interest: e.target.value,
                        })
                      }
                      placeholder="e.g. Tipe A, 100m²"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={form.notes ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                /* ─── VIEW MODE ─── */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 shrink-0" />
                        {lead.email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 shrink-0" />
                        {lead.phone || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Budget
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {formatRupiah(lead.budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Unit Interest
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {lead.unit_interest || '—'}
                      </p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Notes
                      </p>
                      <p className="text-sm whitespace-pre-wrap mt-1">
                        {lead.notes}
                      </p>
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
              onSuccess={(log) =>
                setFollowUps([log, ...followUps])
              }
            />
          )}
        </div>

        {/* ── Right: Cards ── */}
        <div className="space-y-6">
          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Created By
                  </p>
                  <p className="font-medium truncate">
                    {lead.creator_name || 'Unknown'}
                  </p>
                  {lead.created_by === user?.id && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      You
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {lead.editor_name &&
                lead.editor_name !== lead.creator_name && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <Edit3 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Last Edited By
                      </p>
                      <p className="font-medium truncate">
                        {lead.editor_name}
                      </p>
                      {lead.edited_by === user?.id && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs"
                        >
                          You
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lead.updated_at).toLocaleString(
                          'id-ID'
                        )}
                      </p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Lead Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{score}</p>
                <p className="text-sm text-muted-foreground">
                  out of 100
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    grade === 'HOT'
                      ? 'bg-red-500'
                      : grade === 'WARM'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-center text-sm">
                Grade:{' '}
                <span className="font-semibold">{grade}</span>
              </p>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign To</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                // ✅ FIX: gunakan 'unassigned' bukan '' (Radix tidak terima empty string)
                value={lead.assigned_to ?? 'unassigned'}
                onValueChange={handleAssign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-muted-foreground">
                      Unassigned
                    </span>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    // ✅ FIX: value = member.user_id (auth.users.id)
                    // BUKAN member.id (team_members.id)
                    <SelectItem
                      key={member.id}
                      value={member.user_id}
                    >
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
                <p className="text-xs text-muted-foreground">
                  Created
                </p>
                <p>
                  {new Date(lead.created_at).toLocaleDateString(
                    'id-ID'
                  )}
                </p>
              </div>
              {lead.contacted_at && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    First Contact
                  </p>
                  <p>
                    {new Date(
                      lead.contacted_at
                    ).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}
              {lead.last_follow_up_at && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last Follow-up
                  </p>
                  <p>
                    {new Date(
                      lead.last_follow_up_at
                    ).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Follow-up History */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up History</CardTitle>
          <CardDescription>
            {followUps.length} follow-up
            {followUps.length !== 1 ? 's' : ''} logged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FollowUpList logs={followUps} />
        </CardContent>
      </Card>
    </div>
  );
}
