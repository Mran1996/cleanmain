/**
 * Check .env.local file format for Azure Client Secret
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔍 Checking .env.local file format...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('   Location:', envPath);
  process.exit(1);
}

console.log('✅ .env.local file exists');
console.log('   Location:', envPath);
console.log('');

const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n');

// Find AZURE_CLIENT_SECRET line
const secretLine = lines.find(line => line.trim().startsWith('AZURE_CLIENT_SECRET'));

if (!secretLine) {
  console.log('❌ AZURE_CLIENT_SECRET not found in .env.local');
  console.log('\n💡 Add this line to your .env.local file:');
  console.log('   AZURE_CLIENT_SECRET=your_secret_value_here');
  process.exit(1);
}

console.log('✅ AZURE_CLIENT_SECRET found');
console.log('');

// Check for common formatting issues
const issues: string[] = [];

// Check for quotes
if (secretLine.includes('"') || secretLine.includes("'")) {
  issues.push('⚠️  Contains quotes - remove quotes around the value');
}

// Check for spaces around =
const match = secretLine.match(/AZURE_CLIENT_SECRET\s*=\s*(.+)/);
if (!match) {
  issues.push('❌ Invalid format - should be: AZURE_CLIENT_SECRET=value');
} else {
  const value = match[1].trim();
  
  // Check if value is empty
  if (!value || value === '' || value === 'your_azure_client_secret_here') {
    issues.push('❌ Value is empty or placeholder - replace with actual secret');
  }
  
  // Check for leading/trailing spaces in value
  if (value !== value.trim()) {
    issues.push('⚠️  Value has leading/trailing spaces - remove them');
  }
  
  // Show masked value
  const maskedValue = value.length > 8 
    ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
    : '****';
  console.log('   Format check:');
  console.log('   Line:', secretLine.replace(/=.+/, '=***HIDDEN***'));
  console.log('   Value length:', value.length, 'characters');
  console.log('   Value preview:', maskedValue);
}

if (issues.length > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log('   ' + issue));
  console.log('\n✅ Correct format:');
  console.log('   AZURE_CLIENT_SECRET=your_actual_secret_without_quotes');
} else {
  console.log('✅ Format looks correct!');
  console.log('\n💡 If secret still not detected:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Make sure there are no extra spaces or quotes');
  console.log('   3. Verify the secret value is correct from Azure Portal');
}


