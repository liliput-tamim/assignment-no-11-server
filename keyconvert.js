const fs = require('fs');

try {
  const key = fs.readFileSync('./firebase-admin-service-key.json', 'utf8');
  const base64 = Buffer.from(key).toString('base64');
  console.log('Add this to your .env file:');
  console.log('FIREBASE_SERVICE_ACCOUNT_KEY=' + base64);
} catch (error) {
  console.log('Place your firebase-admin-service-key.json file in this directory first.');
  console.log('Then run: node keyconvert.js');
}