'use client';

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';

// ============================================
// Organization & Team Hierarchy
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: OrgSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrgSettings {
  allowedDomains: string[]; // Restrict signups to specific email domains
  requireSSO: boolean;
  ssoProvider?: 'google' | 'microsoft' | 'okta' | 'saml';
  ssoConfig?: SSOConfig;
  dataRetentionDays: number;
  defaultRole: string;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export interface SSOConfig {
  clientId?: string;
  tenantId?: string; // For Microsoft
  domain?: string; // For Okta
  metadataUrl?: string; // For SAML
}

export interface Team {
  id: string;
  orgId: string;
  parentTeamId?: string; // For team hierarchy
  name: string;
  slug: string;
  description?: string;
  memberIds: string[];
  settings: TeamSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamSettings {
  carbonBudgetKg?: number;
  energyBudgetKwh?: number;
  costBudget?: number;
  alertThreshold?: number; // Percentage to trigger alerts
  defaultPUE?: number;
  customCarbonIntensity?: number;
}

// ============================================
// Custom Roles & Permissions
// ============================================

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'team' | 'reports' | 'settings' | 'billing';
}

export const PERMISSIONS: Permission[] = [
  // Data permissions
  { id: 'data:view', name: 'View Data', description: 'View workloads and metrics', category: 'data' },
  { id: 'data:upload', name: 'Upload Data', description: 'Upload new workload data', category: 'data' },
  { id: 'data:edit', name: 'Edit Data', description: 'Edit existing workload data', category: 'data' },
  { id: 'data:delete', name: 'Delete Data', description: 'Delete workload data', category: 'data' },
  { id: 'data:export', name: 'Export Data', description: 'Export data to CSV/JSON', category: 'data' },
  
  // Team permissions
  { id: 'team:view', name: 'View Team', description: 'View team members', category: 'team' },
  { id: 'team:invite', name: 'Invite Members', description: 'Invite new team members', category: 'team' },
  { id: 'team:remove', name: 'Remove Members', description: 'Remove team members', category: 'team' },
  { id: 'team:manage_roles', name: 'Manage Roles', description: 'Change member roles', category: 'team' },
  { id: 'team:create_subteam', name: 'Create Subteams', description: 'Create child teams', category: 'team' },
  
  // Reports permissions
  { id: 'reports:view', name: 'View Reports', description: 'View generated reports', category: 'reports' },
  { id: 'reports:generate', name: 'Generate Reports', description: 'Generate new reports', category: 'reports' },
  { id: 'reports:download', name: 'Download Reports', description: 'Download report files', category: 'reports' },
  { id: 'reports:share', name: 'Share Reports', description: 'Share reports externally', category: 'reports' },
  
  // Settings permissions
  { id: 'settings:view', name: 'View Settings', description: 'View team settings', category: 'settings' },
  { id: 'settings:edit', name: 'Edit Settings', description: 'Modify team settings', category: 'settings' },
  { id: 'settings:integrations', name: 'Manage Integrations', description: 'Configure integrations', category: 'settings' },
  { id: 'settings:api_keys', name: 'Manage API Keys', description: 'Create and revoke API keys', category: 'settings' },
  
  // Billing permissions
  { id: 'billing:view', name: 'View Billing', description: 'View billing information', category: 'billing' },
  { id: 'billing:manage', name: 'Manage Billing', description: 'Update payment methods', category: 'billing' },
];

export interface Role {
  id: string;
  orgId: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  isSystem: boolean; // System roles can't be deleted
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Default system roles
export const DEFAULT_ROLES: Omit<Role, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Owner',
    description: 'Full access to all features and settings',
    permissions: PERMISSIONS.map(p => p.id),
    isSystem: true,
    color: '#f59e0b', // amber
  },
  {
    name: 'Admin',
    description: 'Manage team members and settings',
    permissions: [
      'data:view', 'data:upload', 'data:edit', 'data:delete', 'data:export',
      'team:view', 'team:invite', 'team:remove', 'team:manage_roles',
      'reports:view', 'reports:generate', 'reports:download', 'reports:share',
      'settings:view', 'settings:edit', 'settings:integrations',
    ],
    isSystem: true,
    color: '#8b5cf6', // violet
  },
  {
    name: 'Analyst',
    description: 'View and analyze data, generate reports',
    permissions: [
      'data:view', 'data:upload', 'data:export',
      'team:view',
      'reports:view', 'reports:generate', 'reports:download',
      'settings:view',
    ],
    isSystem: true,
    color: '#3b82f6', // blue
  },
  {
    name: 'Viewer',
    description: 'View-only access to data and reports',
    permissions: [
      'data:view',
      'team:view',
      'reports:view',
    ],
    isSystem: true,
    color: '#6b7280', // gray
  },
];

// ============================================
// Team Membership
// ============================================

export interface TeamMember {
  id: string;
  odId: string;
  teamId: string;
  userId: string;
  roleId: string;
  joinedAt: Timestamp;
  invitedBy?: string;
}

// ============================================
// Audit Logging
// ============================================

export type AuditAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.sso_login'
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'data.uploaded'
  | 'data.deleted'
  | 'data.exported'
  | 'report.generated'
  | 'report.downloaded'
  | 'report.shared'
  | 'settings.updated'
  | 'integration.connected'
  | 'integration.disconnected'
  | 'api_key.created'
  | 'api_key.revoked';

export interface AuditLog {
  id: string;
  orgId: string;
  teamId?: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

// ============================================
// Firebase Operations
// ============================================

const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  TEAMS: 'teams',
  ROLES: 'roles',
  TEAM_MEMBERS: 'team_members',
  AUDIT_LOGS: 'audit_logs',
};

// Organization operations
export async function createOrganization(data: {
  name: string;
  ownerId: string;
  ownerEmail: string;
}): Promise<string> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const orgRef = await addDoc(collection(db, COLLECTIONS.ORGANIZATIONS), {
    name: data.name,
    slug,
    ownerId: data.ownerId,
    plan: 'free',
    settings: {
      allowedDomains: [],
      requireSSO: false,
      dataRetentionDays: 365,
      defaultRole: 'viewer',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create default roles for the organization
  for (const role of DEFAULT_ROLES) {
    await addDoc(collection(db, COLLECTIONS.ROLES), {
      ...role,
      orgId: orgRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Create default team
  const teamRef = await addDoc(collection(db, COLLECTIONS.TEAMS), {
    orgId: orgRef.id,
    name: 'Default Team',
    slug: 'default',
    memberIds: [data.ownerId],
    settings: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add owner as team member with Owner role
  const ownerRoleSnap = await getDocs(
    query(collection(db, COLLECTIONS.ROLES), 
      where('orgId', '==', orgRef.id),
      where('name', '==', 'Owner')
    )
  );
  
  if (!ownerRoleSnap.empty) {
    await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), {
      orgId: orgRef.id,
      teamId: teamRef.id,
      userId: data.ownerId,
      roleId: ownerRoleSnap.docs[0].id,
      joinedAt: serverTimestamp(),
    });
  }

  // Log the action
  await logAuditEvent({
    orgId: orgRef.id,
    teamId: teamRef.id,
    userId: data.ownerId,
    userEmail: data.ownerEmail,
    action: 'team.created',
    resourceType: 'organization',
    resourceId: orgRef.id,
    details: { name: data.name },
  });

  return orgRef.id;
}

// Team operations
export async function createTeam(data: {
  orgId: string;
  parentTeamId?: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByEmail: string;
}): Promise<string> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const teamRef = await addDoc(collection(db, COLLECTIONS.TEAMS), {
    orgId: data.orgId,
    parentTeamId: data.parentTeamId || null,
    name: data.name,
    slug,
    description: data.description || '',
    memberIds: [data.createdBy],
    settings: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add creator as admin of new team
  const adminRoleSnap = await getDocs(
    query(collection(db, COLLECTIONS.ROLES), 
      where('orgId', '==', data.orgId),
      where('name', '==', 'Admin')
    )
  );
  
  if (!adminRoleSnap.empty) {
    await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), {
      orgId: data.orgId,
      teamId: teamRef.id,
      userId: data.createdBy,
      roleId: adminRoleSnap.docs[0].id,
      joinedAt: serverTimestamp(),
    });
  }

  await logAuditEvent({
    orgId: data.orgId,
    teamId: teamRef.id,
    userId: data.createdBy,
    userEmail: data.createdByEmail,
    action: 'team.created',
    resourceType: 'team',
    resourceId: teamRef.id,
    details: { name: data.name, parentTeamId: data.parentTeamId },
  });

  return teamRef.id;
}

// Custom role operations
export async function createCustomRole(data: {
  orgId: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  createdBy: string;
  createdByEmail: string;
}): Promise<string> {
  const roleRef = await addDoc(collection(db, COLLECTIONS.ROLES), {
    orgId: data.orgId,
    name: data.name,
    description: data.description,
    permissions: data.permissions,
    isSystem: false,
    color: data.color,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    orgId: data.orgId,
    userId: data.createdBy,
    userEmail: data.createdByEmail,
    action: 'role.created',
    resourceType: 'role',
    resourceId: roleRef.id,
    details: { name: data.name, permissions: data.permissions },
  });

  return roleRef.id;
}

export async function updateRole(data: {
  roleId: string;
  orgId: string;
  updates: Partial<Pick<Role, 'name' | 'description' | 'permissions' | 'color'>>;
  updatedBy: string;
  updatedByEmail: string;
}): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.ROLES, data.roleId), {
    ...data.updates,
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    orgId: data.orgId,
    userId: data.updatedBy,
    userEmail: data.updatedByEmail,
    action: 'role.updated',
    resourceType: 'role',
    resourceId: data.roleId,
    details: data.updates,
  });
}

export async function deleteRole(data: {
  roleId: string;
  orgId: string;
  deletedBy: string;
  deletedByEmail: string;
}): Promise<void> {
  // Check if role is system role
  const roleDoc = await getDoc(doc(db, COLLECTIONS.ROLES, data.roleId));
  if (roleDoc.exists() && roleDoc.data().isSystem) {
    throw new Error('Cannot delete system roles');
  }

  await deleteDoc(doc(db, COLLECTIONS.ROLES, data.roleId));

  await logAuditEvent({
    orgId: data.orgId,
    userId: data.deletedBy,
    userEmail: data.deletedByEmail,
    action: 'role.deleted',
    resourceType: 'role',
    resourceId: data.roleId,
    details: {},
  });
}

// Member operations
export async function changeMemberRole(data: {
  memberId: string;
  newRoleId: string;
  orgId: string;
  teamId: string;
  changedBy: string;
  changedByEmail: string;
}): Promise<void> {
  const memberDoc = await getDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, data.memberId));
  const oldRoleId = memberDoc.data()?.roleId;

  await updateDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, data.memberId), {
    roleId: data.newRoleId,
  });

  await logAuditEvent({
    orgId: data.orgId,
    teamId: data.teamId,
    userId: data.changedBy,
    userEmail: data.changedByEmail,
    action: 'member.role_changed',
    resourceType: 'team_member',
    resourceId: data.memberId,
    details: { oldRoleId, newRoleId: data.newRoleId },
  });
}

// Audit logging
export async function logAuditEvent(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export async function getAuditLogs(orgId: string, options?: {
  teamId?: string;
  userId?: string;
  action?: AuditAction;
  limit?: number;
}): Promise<AuditLog[]> {
  let q = query(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    where('orgId', '==', orgId),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));

  // Client-side filtering (Firestore doesn't support multiple equality filters without composite indexes)
  if (options?.teamId) {
    logs = logs.filter(log => log.teamId === options.teamId);
  }
  if (options?.userId) {
    logs = logs.filter(log => log.userId === options.userId);
  }
  if (options?.action) {
    logs = logs.filter(log => log.action === options.action);
  }
  if (options?.limit) {
    logs = logs.slice(0, options.limit);
  }

  return logs;
}

// Permission checking
export async function getUserPermissions(userId: string, teamId: string): Promise<string[]> {
  const memberSnap = await getDocs(
    query(collection(db, COLLECTIONS.TEAM_MEMBERS),
      where('teamId', '==', teamId),
      where('userId', '==', userId)
    )
  );

  if (memberSnap.empty) return [];

  const roleId = memberSnap.docs[0].data().roleId;
  const roleDoc = await getDoc(doc(db, COLLECTIONS.ROLES, roleId));

  if (!roleDoc.exists()) return [];

  return roleDoc.data().permissions || [];
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

// Subscribe to org roles
export function subscribeToRoles(orgId: string, callback: (roles: Role[]) => void) {
  return onSnapshot(
    query(collection(db, COLLECTIONS.ROLES), where('orgId', '==', orgId)),
    (snapshot) => {
      const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
      callback(roles);
    }
  );
}

// Subscribe to team hierarchy
export function subscribeToTeams(orgId: string, callback: (teams: Team[]) => void) {
  return onSnapshot(
    query(collection(db, COLLECTIONS.TEAMS), where('orgId', '==', orgId)),
    (snapshot) => {
      const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      callback(teams);
    }
  );
}
