'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  Eye, 
  Edit3, 
  Trash2, 
  Check,
  X,
  Crown,
  UserPlus,
  Link,
  Copy,
  Clock,
  RefreshCw,
  Upload,
  BarChart3,
  Settings,
  FileText,
  Zap,
  AlertTriangle,
  Database
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
  lastActive: string;
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'member' | 'viewer';
  invitedAt: Date;
  inviteCode: string;
}

// Permission definitions for each role
const permissions = {
  viewDashboard: { admin: true, member: true, viewer: true, label: 'View Dashboard', icon: BarChart3 },
  viewReports: { admin: true, member: true, viewer: true, label: 'View Reports', icon: FileText },
  uploadData: { admin: true, member: true, viewer: false, label: 'Upload Data', icon: Upload },
  editWorkloads: { admin: true, member: true, viewer: false, label: 'Edit Workloads', icon: Edit3 },
  manageIntegrations: { admin: true, member: false, viewer: false, label: 'Manage Integrations', icon: Zap },
  editSettings: { admin: true, member: false, viewer: false, label: 'Edit Settings', icon: Settings },
  inviteMembers: { admin: true, member: false, viewer: false, label: 'Invite Members', icon: UserPlus },
  manageRoles: { admin: true, member: false, viewer: false, label: 'Manage Roles', icon: Shield },
  removeMembers: { admin: true, member: false, viewer: false, label: 'Remove Members', icon: Trash2 },
};

const roleConfig = {
  admin: {
    label: 'Admin',
    color: 'text-amber-400 bg-amber-950 border-amber-800',
    icon: Crown,
    description: 'Full access to all features and settings',
  },
  member: {
    label: 'Member',
    color: 'text-blue-400 bg-blue-950 border-blue-800',
    icon: Edit3,
    description: 'Can view, create, and edit workloads',
  },
  viewer: {
    label: 'Viewer',
    color: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    icon: Eye,
    description: 'Read-only access to dashboards',
  },
};

export function TeamManagement() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | 'viewer'>('viewer');
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [showDataWipeModal, setShowDataWipeModal] = useState(false);
  const [dataWipeType, setDataWipeType] = useState<'workloads' | 'metrics' | 'all'>('workloads');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  // Get current user's team
  useEffect(() => {
    if (!auth) return;
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const teamId = userData.currentTeamId || userData.teamIds?.[0];
          setCurrentTeamId(teamId);
          setCurrentUserRole(userData.role || 'member');
        }
      }
    });
    
    return () => unsubAuth();
  }, []);

  // Subscribe to team data from Firebase
  useEffect(() => {
    if (!currentTeamId) return;
    
    // Get team info
    const teamDoc = doc(db, COLLECTIONS.TEAMS, currentTeamId);
    const unsubTeam = onSnapshot(teamDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTeam({
          id: snapshot.id,
          name: data.name || 'My Team',
          memberCount: data.memberIds?.length || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] || '2026-01-15',
        });
      } else {
        // Create default team if doesn't exist
        setTeam({
          id: currentTeamId,
          name: 'My Team',
          memberCount: 1,
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
    });

    // Get team members
    const membersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('teamIds', 'array-contains', currentTeamId)
    );
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          email: d.email || '',
          displayName: d.displayName || d.email?.split('@')[0] || 'User',
          role: d.role || 'member',
          joinedAt: d.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] || '2026-01-15',
          lastActive: d.lastLoginAt ? formatTimeAgo(d.lastLoginAt.toDate()) : 'Never',
        } as TeamMember;
      });
      setMembers(data);
      setIsLoading(false);
    });

    // Get pending invites
    const invitesQuery = query(
      collection(db, 'invites'),
      where('teamId', '==', currentTeamId),
      where('status', '==', 'pending')
    );
    const unsubInvites = onSnapshot(invitesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          email: d.email,
          role: d.role,
          invitedAt: d.invitedAt?.toDate() || new Date(),
          inviteCode: d.inviteCode,
        } as PendingInvite;
      });
      setPendingInvites(data);
    });

    return () => {
      unsubTeam();
      unsubMembers();
      unsubInvites();
    };
  }, [currentTeamId]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !currentTeamId) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await addDoc(collection(db, 'invites'), {
        email: inviteEmail,
        role: inviteRole,
        teamId: currentTeamId,
        status: 'pending',
        inviteCode,
        invitedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      });
      
      setInviteLink(inviteLink);
      setInviteEmail('');
      setShowInviteModal(false);
      setShowInviteLinkModal(true);
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, memberId), {
        role: newRole,
      });
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      // Remove team from user's teamIds
      const member = members.find(m => m.id === memberId);
      if (member) {
        await updateDoc(doc(db, COLLECTIONS.USERS, memberId), {
          teamIds: [], // In production, would filter out just this team
        });
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, 'invites', inviteId));
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
    }
  };

  const handleDataWipe = async () => {
    if (!currentTeamId || wipeConfirmText !== 'DELETE') return;
    
    setIsWiping(true);
    try {
      const collectionsToWipe: string[] = [];
      
      if (dataWipeType === 'workloads' || dataWipeType === 'all') {
        collectionsToWipe.push(COLLECTIONS.WORKLOADS);
      }
      if (dataWipeType === 'metrics' || dataWipeType === 'all') {
        collectionsToWipe.push(COLLECTIONS.METRICS);
      }
      if (dataWipeType === 'all') {
        collectionsToWipe.push('datasets');
      }

      for (const collectionName of collectionsToWipe) {
        const q = query(
          collection(db, collectionName),
          where('teamId', '==', currentTeamId)
        );
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(docSnap => 
          deleteDoc(doc(db, collectionName, docSnap.id))
        );
        await Promise.all(deletePromises);
      }

      setShowDataWipeModal(false);
      setWipeConfirmText('');
    } catch (error) {
      console.error('Failed to wipe data:', error);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-950 border border-amber-800 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">{team?.name || 'My Team'}</h2>
              <p className="text-sm text-neutral-500">{members.length} members • Created {team?.createdAt || '2026-01-15'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite Member</span>
            <span className="sm:hidden">Invite</span>
          </button>
        </div>
      </div>

      {/* Role permissions info */}
      <div className="grid grid-cols-3 gap-px bg-neutral-800">
        {(Object.entries(roleConfig) as [keyof typeof roleConfig, typeof roleConfig[keyof typeof roleConfig]][]).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <div key={role} className="bg-neutral-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-neutral-500" />
                <span className={`badge ${config.color}`}>{config.label}</span>
              </div>
              <p className="text-xs text-neutral-500">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Permissions Matrix */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Permission Matrix</h3>
          <button
            onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
            className="text-xs text-neutral-500 hover:text-neutral-300 font-mono"
          >
            {showPermissionsPanel ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        {showPermissionsPanel && (
          <div className="border border-neutral-800 overflow-hidden">
            <div className="grid grid-cols-4 bg-neutral-800">
              <div className="p-3 text-xs font-mono text-neutral-400 uppercase">Permission</div>
              <div className="p-3 text-xs font-mono text-amber-400 uppercase text-center">Admin</div>
              <div className="p-3 text-xs font-mono text-blue-400 uppercase text-center">Member</div>
              <div className="p-3 text-xs font-mono text-neutral-400 uppercase text-center">Viewer</div>
            </div>
            {Object.entries(permissions).map(([key, perm]) => {
              const Icon = perm.icon;
              return (
                <div key={key} className="grid grid-cols-4 border-t border-neutral-800">
                  <div className="p-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm text-neutral-300">{perm.label}</span>
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    {perm.admin ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-700" />
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    {perm.member ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-700" />
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    {perm.viewer ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Pending Invites</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-amber-950/30 border border-amber-900/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-950 border border-amber-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{invite.email}</p>
                    <p className="text-xs text-neutral-500">Invited {formatTimeAgo(invite.invitedAt)} • Role: {invite.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/join?code=${invite.inviteCode}`;
                      navigator.clipboard.writeText(link);
                    }}
                    className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
                    title="Copy invite link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Cancel invite"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="card">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Team Members</h3>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-neutral-600 animate-spin mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 mb-2">No team members yet</p>
              <p className="text-sm text-neutral-600">Invite colleagues to start collaborating</p>
            </div>
          ) : members.map((member) => {
            const config = roleConfig[member.role];
            const Icon = config.icon;
            const isEditing = editingMember === member.id;

            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-mono text-xs sm:text-sm shrink-0">
                    {member.displayName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{member.displayName}</p>
                    <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">Last active</p>
                    <p className="text-sm text-neutral-400">{member.lastActive}</p>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      {(['admin', 'member', 'viewer'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(member.id, role)}
                          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                            member.role === role
                              ? 'bg-amber-600 text-neutral-950'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                      <button
                        onClick={() => setEditingMember(null)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`badge ${config.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </span>
                      <button
                        onClick={() => setEditingMember(member.id)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-300 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">Invite Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">Role</label>
                <div className="flex gap-2">
                  {(['member', 'viewer'] as const).map((role) => {
                    const config = roleConfig[role];
                    return (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={`flex-1 p-3 text-left transition-colors ${
                          inviteRole === role
                            ? 'bg-amber-950/50 border border-amber-800'
                            : 'bg-neutral-800 border border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <p className="text-sm font-medium text-neutral-200">{config.label}</p>
                        <p className="text-xs text-neutral-500">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="btn-primary flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Success Modal */}
      {showInviteLinkModal && inviteLink && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">Invite Created</h3>
              <button
                onClick={() => { setShowInviteLinkModal(false); setInviteLink(null); }}
                className="p-1.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-neutral-200 mb-2">Invite created successfully!</p>
                <p className="text-sm text-neutral-500">Share this link with your colleague</p>
              </div>

              <div>
                <label className="label">Invite Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="btn-primary px-4"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2">Link expires in 7 days</p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => { setShowInviteLinkModal(false); setInviteLink(null); }}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Section */}
      {currentUserRole === 'admin' && (
        <div className="card border-red-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Data Management</h3>
                <p className="text-xs text-neutral-500 mt-1">Remove old workloads and metrics data</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => { setDataWipeType('workloads'); setShowDataWipeModal(true); }}
              className="p-4 bg-neutral-900 border border-neutral-800 hover:border-red-800 transition-colors text-left"
            >
              <p className="text-sm font-medium text-neutral-200">Clear Workloads</p>
              <p className="text-xs text-neutral-500 mt-1">Remove all uploaded workload data</p>
            </button>
            <button
              onClick={() => { setDataWipeType('metrics'); setShowDataWipeModal(true); }}
              className="p-4 bg-neutral-900 border border-neutral-800 hover:border-red-800 transition-colors text-left"
            >
              <p className="text-sm font-medium text-neutral-200">Clear Metrics</p>
              <p className="text-xs text-neutral-500 mt-1">Remove historical metrics data</p>
            </button>
            <button
              onClick={() => { setDataWipeType('all'); setShowDataWipeModal(true); }}
              className="p-4 bg-red-950/50 border border-red-900/50 hover:border-red-700 transition-colors text-left"
            >
              <p className="text-sm font-medium text-red-400">Clear All Data</p>
              <p className="text-xs text-neutral-500 mt-1">Remove all team data (cannot be undone)</p>
            </button>
          </div>
        </div>
      )}

      {/* Data Wipe Confirmation Modal */}
      {showDataWipeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-red-900/50 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-mono text-red-400 uppercase tracking-wider">Confirm Data Deletion</h3>
              </div>
              <button
                onClick={() => { setShowDataWipeModal(false); setWipeConfirmText(''); }}
                className="p-1.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-950/30 border border-red-900/50">
                <p className="text-sm text-neutral-200 mb-2">
                  You are about to delete{' '}
                  <span className="font-bold text-red-400">
                    {dataWipeType === 'workloads' && 'all workload data'}
                    {dataWipeType === 'metrics' && 'all metrics data'}
                    {dataWipeType === 'all' && 'ALL team data'}
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>

              <div>
                <label className="label">Type DELETE to confirm</label>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setShowDataWipeModal(false); setWipeConfirmText(''); }}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDataWipe}
                  disabled={wipeConfirmText !== 'DELETE' || isWiping}
                  className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isWiping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
