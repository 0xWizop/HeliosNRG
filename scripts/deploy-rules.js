/**
 * Deploy Firestore Security Rules using Admin SDK
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

async function deployRules() {
  console.log('🔐 Deploying Firestore security rules...\n');

  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  try {
    // Use the Security Rules API
    const { SecurityRulesClient } = require('@google-cloud/firestore').v1;
    
    console.log('Rules to deploy:');
    console.log('─'.repeat(50));
    console.log(rules);
    console.log('─'.repeat(50));
    
    console.log('\n⚠️  Note: Security rules must be deployed via Firebase Console or Firebase CLI.');
    console.log('\nTo deploy rules:');
    console.log('1. Go to Firebase Console > Firestore Database > Rules');
    console.log('2. Copy the contents of firestore.rules file');
    console.log('3. Paste and click "Publish"');
    console.log('\nOr use Firebase CLI:');
    console.log('   npx firebase deploy --only firestore:rules');
    
  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

deployRules();
