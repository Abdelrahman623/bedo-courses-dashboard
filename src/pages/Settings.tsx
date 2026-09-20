import React, { useState, useRef, useEffect } from 'react';
import {
  User, Database, Palette, Download, Trash2,
  Check, RefreshCw, HardDrive, LogOut, Upload, AlertTriangle,
  Users, Shield, Mail
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useRoadmapStore } from '../store/roadmapStore';
import { useNotesStore } from '../store/notesStore';
import { useProjectsStore } from '../store/projectsStore';
import { useSessionStore } from '../store/sessionStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storage } from '../lib/storage';

type SettingsTab = 'profile' | 'appearance' | 'database' | 'backup' | 'users';

const ACCENT_THEMES = [
  { id: 'amber', name: 'Scholar Amber', hex: '#F0A500' },
  { id: 'mint', name: 'Emerald Mint', hex: '#00C896' },
  { id: 'sky', name: 'Electric Sky', hex: '#4FC3F7' },
  { id: 'coral', name: 'Vibrant Coral', hex: '#FF6B6B' },
  { id: 'violet', name: 'Royal Violet', hex: '#A78BFA' },
];

export const Settings: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { roadmaps, courses, topics, localNodes, resetLocalRoadmap } = useRoadmapStore();
  const { notes } = useNotesStore();
  const { projects } = useProjectsStore();
  const { sessions, activity } = useSessionStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // ── Profile Form State ──────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(() => {
    return profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Bedo';
  });
  const [username, setUsername] = useState(() => {
    return profile?.username || user?.user_metadata?.username || 'bedo';
  });
  const [bio, setBio] = useState(() => {
    return profile?.bio || storage.get('profile_bio', 'Continuous learner · Tracking my learning journey');
  });
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(() => {
    return profile?.weekly_goal_hours || storage.get('profile_weekly_goal', 10);
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync state when profile is loaded from database
  React.useEffect(() => {
    if (profile) {
      if (profile.name) setDisplayName(profile.name);
      if (profile.username) setUsername(profile.username);
      if (profile.bio !== undefined) setBio(profile.bio || '');
      if (profile.weekly_goal_hours !== undefined) setWeeklyGoalHours(profile.weekly_goal_hours || 10);
    }
  }, [profile]);

  // Fetch all users when users tab is opened
  useEffect(() => {
    if (activeTab === 'users' && isSupabaseConfigured) {
      fetchAllUsers();
      setDeleteError(null);
      setDeleteSuccess(null);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Appearance State ────────────────────────────────────────────────────
  const [currentAccent, setCurrentAccent] = useState(() => {
    return storage.get('theme_accent', '#F0A500');
  });

  // ── Database Diagnostic State ───────────────────────────────────────────
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [testingPing, setTestingPing] = useState(false);

  // ── Backup Notification State ───────────────────────────────────────────
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // ── Restore State ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<{ exportedAt: string; user: { name: string; email: string }; stats: Record<string, number> } | null>(null);
  const [restoreData, setRestoreData] = useState<Record<string, unknown> | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // ── User Management State ──────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<Array<{
    user_id: string;
    email: string;
    name: string;
    username: string;
    created_at: string;
    is_confirmed: boolean;
    notes_count: number;
    sessions_count: number;
    projects_count: number;
  }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; name: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('list_all_users');
      if (!error && data) setAllUsers(data);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { data, error } = await supabase.rpc('delete_user_complete', {
        target_user_id: deleteTarget.user_id,
      });
      if (error) throw error;
      if (data?.deleted === false) throw new Error(data.error || 'Delete failed');
      setDeleteSuccess(`User "${deleteTarget.name}" (${deleteTarget.email}) has been permanently deleted.`);
      setDeleteTarget(null);
      if (deleteTarget.user_id === user?.id) {
        setTimeout(() => signOut(), 2000);
      } else {
        await fetchAllUsers();
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteUnconfirmed = async () => {
    const unconfirmed = allUsers.filter(u => !u.is_confirmed && u.user_id !== user?.id);
    if (unconfirmed.length === 0) return;
    setUsersLoading(true);
    setDeleteError(null);
    let deletedCount = 0;
    for (const u of unconfirmed) {
      try {
        await supabase.rpc('delete_user_complete', { target_user_id: u.user_id });
        deletedCount++;
      } catch { /* continue */ }
    }
    setDeleteSuccess(`Cleaned up ${deletedCount} unconfirmed ghost account${deletedCount !== 1 ? 's' : ''}.`);
    await fetchAllUsers();
    setUsersLoading(false);
  };

  const handleConfirmUser = async (targetUserId: string, userName: string) => {
    setUsersLoading(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.rpc('confirm_user', { target_user_id: targetUserId });
      if (error) throw error;
      setDeleteSuccess(`User "${userName}" has been verified and confirmed.`);
      await fetchAllUsers();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to confirm user.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        // Validate signature
        if (parsed?.app !== 'bedo_courses_dashboard' && parsed?.signature !== 'BCD_BACKUP_V1') {
          if (!parsed?.version || !parsed?.data) {
            setRestoreError('Invalid file — this backup was not exported from Bedo Learn Dashboard.');
            return;
          }
        }
        setRestorePreview({
          exportedAt: parsed.exportedAt || 'Unknown',
          user: parsed.user || {},
          stats: parsed.stats || {},
        });
        setRestoreData(parsed);
      } catch {
        setRestoreError('Could not parse the file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  };


  const handleRestoreConfirm = () => {
    if (!restoreData) return;
    setRestoring(true);
    try {
      const d = restoreData as { data?: { roadmaps?: unknown; courses?: unknown; topics?: unknown; localNodes?: unknown; notes?: unknown; projects?: unknown; sessions?: unknown; activity?: unknown } };
      if (d.data?.roadmaps)   storage.set('roadmaps', d.data.roadmaps);
      if (d.data?.courses)    storage.set('courses', d.data.courses);
      if (d.data?.topics)     storage.set('topics', d.data.topics);
      if (d.data?.localNodes) storage.set('localNodes', d.data.localNodes);
      if (d.data?.notes)      storage.set('notes', d.data.notes);
      if (d.data?.projects)   storage.set('projects', d.data.projects);
      if (d.data?.sessions)   storage.set('sessions', d.data.sessions);
      if (d.data?.activity)   storage.set('activity', d.data.activity);
      setBackupMsg('✓ Backup restored successfully! Refreshing…');
      setRestorePreview(null);
      setRestoreData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setRestoreError('Restore failed. The backup file may be corrupted.');
    } finally {
      setRestoring(false);
    }
  };


  const handleApplyAccent = (hex: string) => {
    setCurrentAccent(hex);
    storage.set('theme_accent', hex);
    localStorage.setItem('theme_accent', hex);
    document.documentElement.style.setProperty('--accent-amber', hex);
    document.documentElement.style.setProperty('--accent-brand', hex);
  };

  // Test live connection to Supabase
  const handleTestConnection = async () => {
    setTestingPing(true);
    setPingStatus(null);
    const start = performance.now();
    try {
      if (!isSupabaseConfigured) {
        setPingStatus('Offline Demo Mode (Local Storage active)');
        setPingLatency(null);
      } else {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const duration = Math.round(performance.now() - start);
        if (error) {
          setPingStatus(`Connected, but query returned note: ${error.message}`);
        } else {
          setPingStatus(`Healthy · Tables connected`);
        }
        setPingLatency(duration);
      }
    } catch (e: unknown) {
      setPingStatus(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setTestingPing(false);
    }
  };

  // Save Profile to local storage & Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    storage.set('profile_name', displayName);
    storage.set('profile_bio', bio);
    storage.set('profile_weekly_goal', weeklyGoalHours);

    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          name: displayName,
          username: username.toLowerCase().trim(),
          bio,
          weekly_goal_hours: weeklyGoalHours,
        }, { onConflict: 'id' });
        if (error) {
          console.error('[Settings] Profile sync error:', error);
        } else {
          await refreshProfile();
        }
      } catch (err) {
        console.warn('[Settings] Profile sync error:', err);
      }
    }

    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const backup = {
      app: 'bedo_courses_dashboard',
      signature: 'BCD_BACKUP_V1',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: displayName,
        username,
      },
      stats: {
        weeklyGoalHours,
        totalSessions: sessions.length,
        totalNotes: notes.length,
        totalProjects: projects.length,
      },
      data: {
        roadmaps,
        courses,
        topics,
        localNodes,
        notes,
        projects,
        sessions,
        activity,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bedo-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Full JSON database backup downloaded successfully.');
    setTimeout(() => setBackupMsg(null), 3000);
  };

  // Export Markdown Notes
  const handleExportMarkdown = () => {
    const md = notes
      .map(
        n =>
          `# ${n.title}\n\n**Tags**: ${n.tags.join(', ') || 'None'}\n**Last Updated**: ${n.updated_at}\n\n---\n\n${n.content}`
      )
      .join('\n\n\n========================================\n\n\n');

    const blob = new Blob([md || '# No notes recorded yet'], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bedo-notes-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Markdown notes exported.');
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleResetRoadmap = () => {
    if (window.confirm('Reset all roadmap topics to "Not Started"? Your study notes will be preserved.')) {
      resetLocalRoadmap();
      alert('All roadmap topics have been reset to "Not Started".');
    }
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Preferences</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure profile, customize theme, verify cloud synchronization, and manage backups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            icon={<LogOut size={13} />}
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* ── Settings Layout: Tab Navigation + Content Panel ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar (3 cols) */}
        <div className="md:col-span-3 space-y-1">
          {(
            [
              { id: 'profile', label: 'Profile & Account', icon: User },
              { id: 'appearance', label: 'Theme & Styling', icon: Palette },
              { id: 'database', label: 'Cloud Sync & Supabase', icon: Database },
              { id: 'backup', label: 'Backups & Storage', icon: HardDrive },
              { id: 'users', label: 'User Management', icon: Users },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer select-none ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={15} className={active ? 'text-accent-amber' : 'text-zinc-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area (9 cols) */}
        <div className="md:col-span-9 space-y-4">
          {/* ── TAB 1: PROFILE ────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <Card hover={false} padding="p-6">
              <div className="pb-4 mb-5">
                <h2 className="text-base font-semibold tracking-tight text-white">Profile Details</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Update your personal learner details and weekly mastery goals
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || 'local-session@demo.internal'}
                    className="w-full bg-[#0A0D14] border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-zinc-500 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">Managed via Supabase Authentication</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Bio & Focus Area
                  </label>
                  <textarea
                    rows={2}
                    value={bio || ''}
                    onChange={e => setBio(e.target.value)}
                    className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Weekly Study Goal (Hours)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={weeklyGoalHours}
                      onChange={e => setWeeklyGoalHours(Number(e.target.value))}
                      className="w-32 bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                    />
                    <span className="text-xs text-zinc-500">
                      Standard: 10 hours/week (~1.5 hours/day)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  {profileSaved ? (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <Check size={14} /> Profile preferences saved!
                    </span>
                  ) : <div />}

                  <Button variant="primary" size="sm" type="submit" loading={savingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── TAB 2: THEME & STYLING ────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <Card hover={false} padding="p-6">
              <div className="pb-4 mb-5">
                <h2 className="text-base font-semibold tracking-tight text-white">Theme Customization</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calibrated Midnight Scholar design palette following Impeccable contrast guidelines
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-3">
                    Primary Accent Color
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {ACCENT_THEMES.map(t => {
                      const isSelected = currentAccent === t.hex;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleApplyAccent(t.hex)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-white/[0.08] border-white/20 shadow-md'
                              : 'bg-[#0D1017] border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full mb-2 flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: t.hex }}
                          >
                            {isSelected && <Check size={14} className="text-[#0D0F14] stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold text-white">{t.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">{t.hex}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Design Tokens & Typography
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#0A0D14] border border-white/[0.06] p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Headings & UI Font</span>
                      <span className="font-semibold text-white">Inter (Sans-serif)</span>
                    </div>
                    <div className="bg-[#0A0D14] border border-white/[0.06] p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Numerals & Code</span>
                      <span className="font-mono font-semibold text-white">JetBrains Mono</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ── TAB 3: DATABASE & CLOUD SYNC ─────────────────────────── */}
          {activeTab === 'database' && (
            <Card hover={false} padding="p-6">
              <div className="pb-4 mb-5">
                <h2 className="text-base font-semibold tracking-tight text-white">Cloud Database Synchronization</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verify real-time connectivity with Supabase PostgreSQL and Row-Level Security
                </p>
              </div>

              <div className="space-y-4">
                {/* Connection Status Pill */}
                <div className="flex items-center justify-between p-3.5 bg-[#0D1017] border border-white/[0.08] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isSupabaseConfigured ? 'bg-[#00C896] animate-pulse' : 'bg-accent-amber'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {isSupabaseConfigured ? 'Supabase Connected' : 'Local Offline Mode'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {supabaseUrl || 'https://placeholder.supabase.co'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    loading={testingPing}
                    icon={<RefreshCw size={13} />}
                    onClick={handleTestConnection}
                  >
                    Test Latency
                  </Button>
                </div>

                {pingStatus && (
                  <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs font-mono text-zinc-300 flex items-center justify-between">
                    <span>{pingStatus}</span>
                    {pingLatency !== null && (
                      <span className="text-[#00C896] font-semibold">{pingLatency} ms</span>
                    )}
                  </div>
                )}

                {/* Cloud Table Ledger */}
                <div className="pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Active Database Schema
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {[
                      'profiles', 'roadmaps', 'courses', 'topics',
                      'notes', 'projects', 'sessions', 'daily_activity',
                    ].map(table => (
                      <div
                        key={table}
                        className="bg-[#0A0D14] border border-white/[0.06] px-2.5 py-1.5 rounded flex items-center justify-between"
                      >
                        <span className="text-zinc-300">{table}</span>
                        <Check size={12} className="text-[#00C896]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ── TAB 4: BACKUPS & STORAGE ─────────────────────────────── */}
          {activeTab === 'backup' && (
            <Card hover={false} padding="p-6">
              <div className="pb-4 mb-5">
                <h2 className="text-base font-semibold tracking-tight text-white">Backups & Data Freedom</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Export complete data backups or reset curriculum progress
                </p>
              </div>

              <div className="space-y-6">
                {backupMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                    <Check size={14} />
                    <span>{backupMsg}</span>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Export Learning Records
                  </h3>
                  <p className="text-xs text-zinc-400 mb-3">
                    Download full structured data including all 70+ topics, study sessions, and notes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={handleExportJSON}
                    >
                      Export Full Backup (JSON)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={handleExportMarkdown}
                    >
                      Export Notes (Markdown)
                    </Button>
                  </div>
                </div>

                {/* ── Import / Restore Backup ─── */}
                <div className="pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Import &amp; Restore Backup
                  </h3>
                  <p className="text-xs text-zinc-400 mb-3">
                    Restore data from a JSON backup file previously exported from this dashboard.
                  </p>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {restoreError && (
                    <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                      <AlertTriangle size={13} />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  {!restorePreview ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Upload size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select Backup File (.json)
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Preview card */}
                      <div className="p-3.5 bg-[#0D1017] border border-white/[0.08] rounded-xl space-y-2">
                        <p className="text-xs font-semibold text-white">Backup Preview</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <span className="text-zinc-500">Exported at</span>
                          <span className="text-zinc-300 font-mono">{new Date(restorePreview.exportedAt).toLocaleString()}</span>
                          {restorePreview.user?.name && (
                            <>
                              <span className="text-zinc-500">User</span>
                              <span className="text-zinc-300">{restorePreview.user.name}</span>
                            </>
                          )}
                          {Object.entries(restorePreview.stats).map(([k, v]) => (
                            <React.Fragment key={k}>
                              <span className="text-zinc-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-zinc-300 font-mono">{String(v)}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRestorePreview(null); setRestoreData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Upload size={13} />}
                          loading={restoring}
                          onClick={handleRestoreConfirm}
                        >
                          Restore This Backup
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger Area */}
                <div className="pt-5 border-t border-rose-500/20">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                    Danger Zone
                  </h3>
                  <p className="text-xs text-zinc-400 mb-3">
                    Reset all roadmap topic statuses back to "Not Started" to begin a clean curriculum run.
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={handleResetRoadmap}
                  >
                    Reset Roadmap Topics Progress
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── TAB 5: USER MANAGEMENT ─────────────────────────────── */}
          {activeTab === 'users' && (
            <Card hover={false} padding="p-6">
              <div className="pb-4 mb-5">
                <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                  <Shield size={16} className="text-accent-amber" />
                  User Management
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  All registered accounts. Deleting a user permanently removes their account,
                  password, and all associated data (notes, projects, sessions).
                </p>
              </div>

              {deleteSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                  <Check size={14} /><span>{deleteSuccess}</span>
                </div>
              )}

              {!isSupabaseConfigured ? (
                <p className="text-xs text-zinc-500">Supabase is not configured.</p>
              ) : (
                <div className="space-y-3">

                  {/* Ghost accounts warning banner */}
                  {allUsers.some(u => !u.is_confirmed) && (
                    <div className="flex items-center justify-between p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-300">
                            {allUsers.filter(u => !u.is_confirmed).length} unconfirmed ghost account{allUsers.filter(u => !u.is_confirmed).length !== 1 ? 's' : ''} found
                          </p>
                          <p className="text-[10px] text-amber-500/80 mt-0.5">
                            These emails never confirmed. They block re-registration with the same address.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={12} />}
                        loading={usersLoading}
                        onClick={handleDeleteUnconfirmed}
                      >
                        Clean Up
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-mono">{allUsers.length} account{allUsers.length !== 1 ? 's' : ''} registered</span>
                    <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchAllUsers} loading={usersLoading}>
                      Refresh
                    </Button>
                  </div>

                  {usersLoading && allUsers.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">Loading users…</p>
                  ) : allUsers.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">No accounts found.</p>
                  ) : (
                    <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.08] overflow-hidden">
                      {allUsers.map(u => (
                        <div
                          key={u.user_id}
                          className={`flex items-center justify-between px-4 py-3 transition-colors ${
                            !u.is_confirmed
                              ? 'bg-amber-500/5 hover:bg-amber-500/8'
                              : 'bg-bg-surface/30 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar initial */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                              u.user_id === user?.id
                                ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
                                : !u.is_confirmed
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-white/[0.06] text-zinc-300 border border-white/[0.08]'
                            }`}>
                              {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-semibold text-white truncate">
                                  {u.name || u.email?.split('@')[0] || '—'}
                                </p>
                                {u.user_id === user?.id && (
                                  <span className="text-[10px] bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-1.5 py-0.5 rounded font-medium">You</span>
                                )}
                                {!u.is_confirmed && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                                    ⚠ Unconfirmed
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail size={10} className="text-zinc-600" />
                                <p className="text-[11px] text-zinc-500 font-mono truncate">{u.email}</p>
                                {u.username && <span className="text-[10px] text-zinc-600">· @{u.username}</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600 font-mono">
                                <span>{u.notes_count} notes</span>
                                <span>{u.sessions_count} sessions</span>
                                <span>{u.projects_count} projects</span>
                                <span>joined {new Date(u.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                            <div className="flex items-center gap-2">
                              {!u.is_confirmed && (
                                <Button
                                  variant="mint"
                                  size="sm"
                                  icon={<Check size={12} />}
                                  loading={usersLoading}
                                  onClick={() => handleConfirmUser(u.user_id, u.name || u.email)}
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={12} />}
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteSuccess(null);
                                  setDeleteTarget({ user_id: u.user_id, name: u.name || u.email, email: u.email });
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Delete User Confirmation Modal ─────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-[#161A23] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Delete User Account</h3>
                <p className="text-[11px] text-zinc-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-[#0D1017] border border-white/[0.06] rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs font-semibold text-white">{deleteTarget.name}</p>
              <p className="text-[11px] text-zinc-400 font-mono">{deleteTarget.email}</p>
              <p className="text-[11px] text-zinc-600 mt-1">All notes, projects, sessions, and login credentials will be permanently erased.</p>
            </div>

            {deleteError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle size={12} /><span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" size="sm" icon={<Trash2 size={13} />} loading={deleting} onClick={handleDeleteUser}>
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
