/**
 * Firebase Admin Setup Script
 * Sets up Firestore collections, indexes, security rules, and seeds initial data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  WORKLOADS: 'workloads',
  METRICS: 'metrics',
  INTEGRATIONS: 'integrations',
  INVITES: 'invites',
  ASSUMPTIONS: 'assumptions',
};

// Sample data for seeding
const sampleTeam = {
  name: 'Demo Team',
  companyName: 'Helios Demo',
  size: '11-50',
  ownerId: 'demo-user-001',
  memberIds: ['demo-user-001'],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  settings: {
    defaultPUE: 1.58,
    defaultCarbonIntensity: 436,
  },
};

const sampleWorkloads = [
  {
    name: 'ML Training Pipeline',
    type: 'ml_training',
    provider: 'AWS',
    region: 'us-east-1',
    instanceType: 'p3.2xlarge',
    vcpus: 8,
    memoryGb: 61,
    runtimeHours: 24.5,
    avgCpuUtilization: 78.3,
    avgMemoryUtilization: 65.2,
    totalCost: 245.80,
    totalEnergy: 18.5,
    totalCarbon: 8.2,
    confidence: 85,
    startTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T08:00:00Z')),
    endTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-16T08:30:00Z')),
  },
  {
    name: 'Daily ETL Pipeline',
    type: 'batch',
    provider: 'AWS',
    region: 'us-east-1',
    instanceType: 'r5.4xlarge',
    vcpus: 16,
    memoryGb: 128,
    runtimeHours: 6.5,
    avgCpuUtilization: 45.2,
    avgMemoryUtilization: 82.4,
    totalCost: 52.40,
    totalEnergy: 4.2,
    totalCarbon: 1.8,
    confidence: 78,
    startTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T00:00:00Z')),
    endTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T06:30:00Z')),
  },
  {
    name: 'Azure ML Training',
    type: 'ml_training',
    provider: 'Azure',
    region: 'eastus',
    instanceType: 'Standard_NC6s_v3',
    vcpus: 6,
    memoryGb: 112,
    runtimeHours: 12.8,
    avgCpuUtilization: 85.2,
    avgMemoryUtilization: 72.4,
    totalCost: 185.60,
    totalEnergy: 12.8,
    totalCarbon: 5.4,
    confidence: 82,
    startTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T14:00:00Z')),
    endTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-16T02:48:00Z')),
  },
  {
    name: 'GCP Vertex AI Training',
    type: 'ml_training',
    provider: 'GCP',
    region: 'us-central1',
    instanceType: 'n1-standard-8-nvidia-tesla-v100',
    vcpus: 8,
    memoryGb: 30,
    runtimeHours: 15.5,
    avgCpuUtilization: 88.4,
    avgMemoryUtilization: 62.5,
    totalCost: 168.25,
    totalEnergy: 14.2,
    totalCarbon: 2.8,
    confidence: 88,
    startTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T11:00:00Z')),
    endTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-16T02:30:00Z')),
  },
  {
    name: 'Production API Cluster',
    type: 'api',
    provider: 'AWS',
    region: 'us-east-1',
    instanceType: 'c5.2xlarge',
    vcpus: 8,
    memoryGb: 16,
    runtimeHours: 720,
    avgCpuUtilization: 34.5,
    avgMemoryUtilization: 42.1,
    totalCost: 1248.00,
    totalEnergy: 52.4,
    totalCarbon: 23.2,
    confidence: 92,
    startTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
    endTime: admin.firestore.Timestamp.fromDate(new Date('2026-01-31T00:00:00Z')),
  },
];

const sampleMetrics = [];
// Generate daily metrics for the past 30 days
for (let i = 0; i < 30; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  date.setHours(12, 0, 0, 0);
  
  sampleMetrics.push({
    timestamp: admin.firestore.Timestamp.fromDate(date),
    cost: Math.round((50 + Math.random() * 150) * 100) / 100,
    energyKwh: Math.round((10 + Math.random() * 40) * 100) / 100,
    carbonKg: Math.round((5 + Math.random() * 20) * 100) / 100,
    workloadCount: Math.floor(3 + Math.random() * 8),
  });
}

const sampleAssumptions = {
  pue: {
    value: 1.58,
    source: 'Industry Average (Uptime Institute 2025)',
    description: 'Power Usage Effectiveness - ratio of total facility power to IT equipment power',
    confidence: 75,
  },
  carbonIntensity: {
    value: 436,
    unit: 'gCO2/kWh',
    source: 'EPA eGRID 2025',
    description: 'Grid carbon intensity varies by region and time',
    confidence: 80,
  },
  serverEfficiency: {
    value: 0.85,
    source: 'Hardware manufacturer specifications',
    description: 'Estimated power supply and conversion efficiency',
    confidence: 70,
  },
};

async function setupCollections() {
  console.log('🔥 Setting up Firebase collections...\n');

  try {
    // Create demo team
    console.log('📁 Creating teams collection...');
    const teamRef = await db.collection(COLLECTIONS.TEAMS).add(sampleTeam);
    const teamId = teamRef.id;
    console.log(`   ✓ Created team: ${teamId}`);

    // Create sample workloads
    console.log('\n📁 Creating workloads collection...');
    for (const workload of sampleWorkloads) {
      const workloadRef = await db.collection(COLLECTIONS.WORKLOADS).add({
        ...workload,
        teamId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✓ Created workload: ${workload.name}`);
    }

    // Create sample metrics
    console.log('\n📁 Creating metrics collection...');
    for (const metric of sampleMetrics) {
      await db.collection(COLLECTIONS.METRICS).add({
        ...metric,
        teamId,
      });
    }
    console.log(`   ✓ Created ${sampleMetrics.length} daily metrics`);

    // Create assumptions
    console.log('\n📁 Creating assumptions collection...');
    await db.collection(COLLECTIONS.ASSUMPTIONS).doc(teamId).set({
      ...sampleAssumptions,
      teamId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('   ✓ Created default assumptions');

    // Create integrations placeholder
    console.log('\n📁 Creating integrations collection...');
    await db.collection(COLLECTIONS.INTEGRATIONS).doc(teamId).set({
      teamId,
      aws: { connected: false, lastSync: null },
      azure: { connected: false, lastSync: null },
      gcp: { connected: false, lastSync: null },
      databricks: { connected: false, lastSync: null },
      snowflake: { connected: false, lastSync: null },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('   ✓ Created integrations placeholder');

    console.log('\n✅ All collections created successfully!');
    console.log(`\n📋 Team ID for testing: ${teamId}`);
    
    return teamId;
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    throw error;
  }
}

async function updateSecurityRules() {
  console.log('\n🔐 Security rules should be updated in Firebase Console.');
  console.log('   Copy the rules from firestore.rules file to Firebase Console > Firestore > Rules');
}

async function createIndexes() {
  console.log('\n📇 Creating Firestore indexes...');
  console.log('   Note: Complex indexes must be created via Firebase Console or firebase.json');
  console.log('   Required indexes:');
  console.log('   - workloads: teamId ASC, createdAt DESC');
  console.log('   - metrics: teamId ASC, timestamp ASC');
  console.log('   - invites: teamId ASC, status ASC');
}

async function main() {
  console.log('═'.repeat(60));
  console.log('   HELIOS ENERGY - Firebase Setup Script');
  console.log('═'.repeat(60) + '\n');

  try {
    const teamId = await setupCollections();
    await updateSecurityRules();
    await createIndexes();

    console.log('\n' + '═'.repeat(60));
    console.log('   Setup Complete!');
    console.log('═'.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Update Firestore security rules in Firebase Console');
    console.log('2. Create required indexes in Firebase Console');
    console.log('3. Test the application with the sample data');
    console.log(`\nDemo Team ID: ${teamId}`);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
