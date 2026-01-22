'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Edit3,
  Trash2,
  Check,
  X,
  FolderTree,
  Lock,
  Globe,
  Clock,
  RefreshCw,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { 
  Organization, 
  Team, 
  Role, 
  PERMISSIONS, 
  Permission,
  createTeam, 
  createCustomRole, 
  updateRole, 
  deleteRole,
  subscribeToRoles,
  subscribeToTeams,
  logAuditEvent
} from '@/lib/firebase/enterprise';
import { AuditLogPanel } from './AuditLog';
import { useTutorial } from '@/contexts/TutorialContext';
import { Loader } from './Loader';

type SettingsTab = 'organization' | 'teams' | 'roles' | 'security' | 'preferences' | 'audit';

export function OrganizationSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');
  const [org, setOrg] = useState<Organization | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({ uid: user.uid, email: user.email, ...userData });
          
          // Get org ID from team
          const teamId = userData.currentTeamId || userData.teamIds?.[0];
          if (teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', teamId));
            if (teamDoc.exists()) {
              const orgId = teamDoc.data().orgId || teamId;
              setCurrentOrgId(orgId);
            } else {
              setCurrentOrgId(teamId);
            }
          }
        }
        setIsLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentOrgId) return;

    // Subscribe to roles
    const unsubRoles = subscribeToRoles(currentOrgId, setRoles);
    
    // Subscribe to teams
    const unsubTeams = subscribeToTeams(currentOrgId, setTeams);

    // Get org info
    const orgRef = doc(db, 'organizations', currentOrgId);
    const unsubOrg = onSnapshot(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        setOrg({ id: snapshot.id, ...snapshot.data() } as Organization);
      }
    });

    return () => {
      unsubRoles();
      unsubTeams();
      unsubOrg();
    };
  }, [currentOrgId]);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'teams', label: 'Teams', icon: FolderTree },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: Clock },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" label="Loading settings" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-neutral-800 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2 sm:px-4 py-2 text-[10px] sm:text-sm font-mono uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'text-amber-500 border-b-2 border-amber-500 -mb-px'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'organization' && (
        <OrganizationTab org={org} currentUser={currentUser} />
      )}
      {activeTab === 'teams' && (
        <TeamsTab 
          teams={teams} 
          orgId={currentOrgId!} 
          currentUser={currentUser}
          roles={roles}
        />
      )}
      {activeTab === 'roles' && (
        <RolesTab 
          roles={roles} 
          orgId={currentOrgId!} 
          currentUser={currentUser} 
        />
      )}
      {activeTab === 'security' && (
        <SecurityTab org={org} orgId={currentOrgId!} currentUser={currentUser} />
      )}
      {activeTab === 'preferences' && (
        <PreferencesTab />
      )}
      {activeTab === 'audit' && currentOrgId && (
        <AuditLogPanel orgId={currentOrgId} />
      )}
    </div>
  );
}

// Organization Settings Tab
function OrganizationTab({ org, currentUser }: { org: Organization | null; currentUser: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(org?.name || '');

  useEffect(() => {
    if (org) setName(org.name);
  }, [org]);

  const handleSave = async () => {
    if (!org) return;
    await updateDoc(doc(db, 'organizations', org.id), { name });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Organization Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Organization Name</label>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input flex-1"
                />
                <button onClick={handleSave} className="btn-primary px-3">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-outline px-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-neutral-200">{org?.name || 'My Organization'}</span>
                <button onClick={() => setIsEditing(true)} className="text-neutral-500 hover:text-neutral-300">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="label">Plan</label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-mono uppercase ${
                org?.plan === 'enterprise' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                org?.plan === 'pro' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}>
                {org?.plan || 'Free'}
              </span>
              {org?.plan !== 'enterprise' && (
                <button className="text-xs text-amber-500 hover:text-amber-400">
                  Upgrade
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">Organization ID</label>
            <code className="text-sm text-neutral-500 font-mono">{org?.id || 'N/A'}</code>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Data Retention</h3>
        <div>
          <label className="label">Retention Period</label>
          <select className="input w-full max-w-xs">
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365" selected>1 year</option>
            <option value="730">2 years</option>
            <option value="0">Indefinite</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">Data older than this will be automatically deleted</p>
        </div>
      </div>
    </div>
  );
}

// Teams Tab with Hierarchy
function TeamsTab({ teams, orgId, currentUser, roles }: { 
  teams: Team[]; 
  orgId: string; 
  currentUser: any;
  roles: Role[];
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [parentTeamId, setParentTeamId] = useState<string | undefined>();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const toggleExpand = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    await createTeam({
      orgId,
      parentTeamId,
      name: newTeamName,
      description: newTeamDescription,
      createdBy: currentUser.uid,
      createdByEmail: currentUser.email,
    });
    
    setShowCreateModal(false);
    setNewTeamName('');
    setNewTeamDescription('');
    setParentTeamId(undefined);
  };

  // Build team hierarchy
  const rootTeams = teams.filter(t => !t.parentTeamId);
  const getChildTeams = (parentId: string) => teams.filter(t => t.parentTeamId === parentId);

  const renderTeam = (team: Team, depth: number = 0) => {
    const children = getChildTeams(team.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedTeams.has(team.id);

    return (
      <div key={team.id}>
        <div 
          className={`flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors ${
            depth > 0 ? 'border-l-2 border-neutral-700 ml-4' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button onClick={() => toggleExpand(team.id)} className="p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <FolderTree className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-sm text-neutral-200">{team.name}</span>
              {team.description && (
                <p className="text-xs text-neutral-500">{team.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">
              {team.memberIds?.length || 0} members
            </span>
            <button 
              onClick={() => {
                setParentTeamId(team.id);
                setShowCreateModal(true);
              }}
              className="p-1.5 text-neutral-500 hover:text-neutral-300"
              title="Add sub-team"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderTeam(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Team Hierarchy</h3>
        <button 
          onClick={() => {
            setParentTeamId(undefined);
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Team
        </button>
      </div>

      <div className="card p-0 divide-y divide-neutral-800">
        {rootTeams.length === 0 ? (
          <div className="p-8 text-center">
            <FolderTree className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No teams yet. Create your first team to get started.</p>
          </div>
        ) : (
          rootTeams.map(team => renderTeam(team))
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md p-6">
            <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider mb-4">
              {parentTeamId ? 'Create Sub-Team' : 'Create Team'}
            </h3>
            
            <div className="space-y-4">
              {parentTeamId && (
                <div className="p-3 bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs text-neutral-500 uppercase mb-1">Parent Team</p>
                  <p className="text-sm text-neutral-200">
                    {teams.find(t => t.id === parentTeamId)?.name}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Data Engineering"
                />
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="What does this team do?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="btn-outline">
                  Cancel
                </button>
                <button onClick={handleCreateTeam} className="btn-primary">
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Roles Tab
function RolesTab({ roles, orgId, currentUser }: { 
  roles: Role[]; 
  orgId: string; 
  currentUser: any;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [newRoleColor, setNewRoleColor] = useState('#6b7280');

  const permissionCategories = Array.from(new Set(PERMISSIONS.map(p => p.category)));

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    
    await createCustomRole({
      orgId,
      name: newRoleName,
      description: newRoleDescription,
      permissions: newRolePermissions,
      color: newRoleColor,
      createdBy: currentUser.uid,
      createdByEmail: currentUser.email,
    });
    
    resetForm();
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    await updateRole({
      roleId: editingRole.id,
      orgId,
      updates: {
        name: newRoleName,
        description: newRoleDescription,
        permissions: newRolePermissions,
        color: newRoleColor,
      },
      updatedBy: currentUser.uid,
      updatedByEmail: currentUser.email,
    });
    
    resetForm();
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    await deleteRole({
      roleId,
      orgId,
      deletedBy: currentUser.uid,
      deletedByEmail: currentUser.email,
    });
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRolePermissions([]);
    setNewRoleColor('#6b7280');
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    setNewRolePermissions(role.permissions);
    setNewRoleColor(role.color);
    setShowCreateModal(true);
  };

  const togglePermission = (permId: string) => {
    if (newRolePermissions.includes(permId)) {
      setNewRolePermissions(newRolePermissions.filter(p => p !== permId));
    } else {
      setNewRolePermissions([...newRolePermissions, permId]);
    }
  };

  const colorOptions = [
    '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#ec4899', '#6b7280'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Roles & Permissions</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div key={role.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <h4 className="font-medium text-neutral-200">{role.name}</h4>
                  <p className="text-xs text-neutral-500">{role.description}</p>
                </div>
                {role.isSystem && (
                  <span className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-500 border border-neutral-700">
                    System
                  </span>
                )}
              </div>
              {!role.isSystem && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(role)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 6).map((permId) => {
                const perm = PERMISSIONS.find(p => p.id === permId);
                return perm ? (
                  <span key={permId} className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {perm.name}
                  </span>
                ) : null;
              })}
              {role.permissions.length > 6 && (
                <span className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-500">
                  +{role.permissions.length - 6} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider mb-4">
              {editingRole ? 'Edit Role' : 'Create Custom Role'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="input w-full"
                    placeholder="e.g., Data Analyst"
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewRoleColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newRoleColor === color ? 'border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="input w-full"
                  placeholder="What can this role do?"
                />
              </div>

              <div>
                <label className="label">Permissions</label>
                <div className="space-y-4 mt-2">
                  {permissionCategories.map((category) => (
                    <div key={category} className="bg-neutral-800/50 border border-neutral-700 p-3">
                      <h5 className="text-xs font-mono text-neutral-400 uppercase mb-2">{category}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.category === category).map((perm) => (
                          <label key={perm.id} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newRolePermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-0.5"
                            />
                            <div>
                              <span className="text-sm text-neutral-200">{perm.name}</span>
                              <p className="text-xs text-neutral-500">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={resetForm} className="btn-outline">
                  Cancel
                </button>
                <button 
                  onClick={editingRole ? handleUpdateRole : handleCreateRole} 
                  className="btn-primary"
                >
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Security Tab
function SecurityTab({ org, orgId, currentUser }: { 
  org: Organization | null; 
  orgId: string;
  currentUser: any;
}) {
  const [allowedDomains, setAllowedDomains] = useState<string[]>(org?.settings?.allowedDomains || []);
  const [newDomain, setNewDomain] = useState('');
  const [requireSSO, setRequireSSO] = useState(org?.settings?.requireSSO || false);
  const [ssoProvider, setSsoProvider] = useState(org?.settings?.ssoProvider || '');

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const domain = newDomain.trim().toLowerCase();
    if (!allowedDomains.includes(domain)) {
      setAllowedDomains([...allowedDomains, domain]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  };

  const handleSaveSettings = async () => {
    if (!orgId) return;
    
    await updateDoc(doc(db, 'organizations', orgId), {
      'settings.allowedDomains': allowedDomains,
      'settings.requireSSO': requireSSO,
      'settings.ssoProvider': ssoProvider || null,
    });

    await logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      action: 'settings.updated',
      resourceType: 'security_settings',
      details: { allowedDomains, requireSSO, ssoProvider },
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Domain Restrictions</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Restrict sign-ups to specific email domains. Leave empty to allow any domain.
        </p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="input flex-1"
            placeholder="company.com"
          />
          <button onClick={handleAddDomain} className="btn-primary px-4">
            Add
          </button>
        </div>
        
        {allowedDomains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allowedDomains.map((domain) => (
              <span key={domain} className="flex items-center gap-1 px-2 py-1 bg-neutral-800 border border-neutral-700 text-sm">
                <Globe className="w-3 h-3 text-neutral-500" />
                {domain}
                <button onClick={() => handleRemoveDomain(domain)} className="text-neutral-500 hover:text-red-400 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4">Single Sign-On (SSO)</h3>
        
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={requireSSO}
            onChange={(e) => setRequireSSO(e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <span className="text-sm text-neutral-200">Require SSO for all users</span>
            <p className="text-xs text-neutral-500">Users must sign in with SSO provider</p>
          </div>
        </label>

        {requireSSO && (
          <div>
            <label className="label">SSO Provider</label>
            <select
              value={ssoProvider}
              onChange={(e) => setSsoProvider(e.target.value)}
              className="input w-full max-w-xs"
            >
              <option value="">Select provider...</option>
              <option value="google">Google Workspace</option>
              <option value="microsoft">Microsoft Azure AD</option>
              <option value="okta">Okta</option>
              <option value="saml">Custom SAML</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveSettings} className="btn-primary">
          Save Security Settings
        </button>
      </div>
    </div>
  );
}

// Preferences Tab - Tutorial/Tooltip Settings
function PreferencesTab() {
  const { tutorialsEnabled, setTutorialsEnabled, resetTooltips, dismissedTooltips } = useTutorial();
  const dismissedCount = dismissedTooltips.size;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Tutorial & Tooltips</h3>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Control in-app guidance and contextual help tooltips. Disable these if your team is already familiar with the platform.
        </p>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition-colors">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-sm text-neutral-200">Enable tutorial tooltips</span>
                <p className="text-xs text-neutral-500">Show helpful tips when hovering over features</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={tutorialsEnabled}
                onChange={(e) => setTutorialsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-neutral-950"></div>
            </div>
          </label>

          {dismissedCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-neutral-800/30 border border-neutral-800">
              <div>
                <span className="text-sm text-neutral-300">{dismissedCount} tooltip{dismissedCount !== 1 ? 's' : ''} dismissed</span>
                <p className="text-xs text-neutral-500">Reset to see all tooltips again</p>
              </div>
              <button
                onClick={resetTooltips}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-amber-500 border border-neutral-700 hover:border-amber-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-neutral-900/50">
        <h4 className="text-sm font-medium text-neutral-200 mb-2">For Advanced Teams</h4>
        <p className="text-xs text-neutral-500">
          If your team is experienced with Helios, you can disable tutorials to reduce UI clutter. 
          Individual users can also dismiss specific tooltips as they learn.
        </p>
      </div>
    </div>
  );
}
