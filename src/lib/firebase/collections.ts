import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  WORKLOADS: 'workloads',
  METRICS: 'metrics',
  ASSUMPTIONS: 'assumptions',
  SCENARIOS: 'scenarios',
  REPORTS: 'reports',
  INTEGRATIONS: 'integrations',
  ALERTS: 'alerts',
} as const;

// Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  teamIds: string[];
  role: 'admin' | 'member' | 'viewer';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Timestamp;
  settings: {
    defaultCurrency: string;
    carbonUnit: 'kg' | 'tons';
    alertThresholds: {
      costPerDay: number;
      carbonPerDay: number;
    };
  };
}

export interface Workload {
  id: string;
  teamId: string;
  name: string;
  type: 'training' | 'inference' | 'data_processing' | 'other';
  provider: 'aws' | 'gcp' | 'azure' | 'snowflake' | 'databricks' | 'custom';
  region: string;
  instanceType: string;
  status: 'running' | 'stopped' | 'completed';
  startedAt: Timestamp;
  endedAt?: Timestamp;
  tags: Record<string, string>;
}

export interface MetricSnapshot {
  id: string;
  workloadId: string;
  teamId: string;
  timestamp: Timestamp;
  cost: number;
  energyKwh: number;
  carbonKg: number;
  gpuUtilization?: number;
  cpuUtilization?: number;
  memoryUtilization?: number;
  confidence: number;
}

export interface Integration {
  id: string;
  teamId: string;
  provider: 'aws' | 'gcp' | 'azure' | 'snowflake' | 'databricks';
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Timestamp;
  config: {
    region?: string;
    accountId?: string;
    pollIntervalMinutes: number;
  };
  credentials: {
    encryptedKey?: string;
    roleArn?: string;
  };
}

// User functions
export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
}

export async function createUser(userId: string, data: Omit<User, 'id'>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), data);
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), data);
}

// Team functions
export async function getTeam(teamId: string): Promise<Team | null> {
  const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Team : null;
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const q = query(
    collection(db, COLLECTIONS.TEAMS),
    where('memberIds', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Team);
}

export async function createTeam(data: Omit<Team, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.TEAMS), data);
  return docRef.id;
}

export async function updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TEAMS, teamId), data);
}

// Workload functions
export async function getWorkload(workloadId: string): Promise<Workload | null> {
  const docRef = doc(db, COLLECTIONS.WORKLOADS, workloadId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Workload : null;
}

export async function getTeamWorkloads(teamId: string): Promise<Workload[]> {
  const q = query(
    collection(db, COLLECTIONS.WORKLOADS),
    where('teamId', '==', teamId),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Workload);
}

export async function createWorkload(data: Omit<Workload, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.WORKLOADS), data);
  return docRef.id;
}

export async function updateWorkload(workloadId: string, data: Partial<Workload>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.WORKLOADS, workloadId), data);
}

// Metrics functions
export async function getWorkloadMetrics(
  workloadId: string, 
  startDate: Date, 
  endDate: Date
): Promise<MetricSnapshot[]> {
  const q = query(
    collection(db, COLLECTIONS.METRICS),
    where('workloadId', '==', workloadId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MetricSnapshot);
}

export async function getTeamMetrics(
  teamId: string, 
  startDate: Date, 
  endDate: Date
): Promise<MetricSnapshot[]> {
  const q = query(
    collection(db, COLLECTIONS.METRICS),
    where('teamId', '==', teamId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MetricSnapshot);
}

export async function addMetricSnapshot(data: Omit<MetricSnapshot, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.METRICS), data);
  return docRef.id;
}

// Real-time subscriptions
export function subscribeToTeamMetrics(
  teamId: string,
  callback: (metrics: MetricSnapshot[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.METRICS),
    where('teamId', '==', teamId),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  
  return onSnapshot(q, (snapshot) => {
    const metrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MetricSnapshot);
    callback(metrics);
  });
}

export function subscribeToWorkloads(
  teamId: string,
  callback: (workloads: Workload[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.WORKLOADS),
    where('teamId', '==', teamId),
    where('status', '==', 'running')
  );
  
  return onSnapshot(q, (snapshot) => {
    const workloads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Workload);
    callback(workloads);
  });
}

// Integration functions
export async function getTeamIntegrations(teamId: string): Promise<Integration[]> {
  const q = query(
    collection(db, COLLECTIONS.INTEGRATIONS),
    where('teamId', '==', teamId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Integration);
}

export async function createIntegration(data: Omit<Integration, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.INTEGRATIONS), data);
  return docRef.id;
}

export async function updateIntegration(integrationId: string, data: Partial<Integration>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.INTEGRATIONS, integrationId), data);
}

export async function deleteIntegration(integrationId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.INTEGRATIONS, integrationId));
}
