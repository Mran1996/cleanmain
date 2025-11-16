const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

// Extract project reference from Supabase URL
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('🚀 Running Complete Chat System Migration');
console.log('Project Reference:', projectRef);
console.log('Supabase URL:', supabaseUrl);

// Set environment variables for Supabase CLI
const envVars = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY
};

// Try to run the migration directly using Supabase CLI
async function runMigration() {
  try {
    console.log('📋 Attempting to run migration via Supabase CLI...');
    
    // First, let's try to use the Supabase CLI with the fixed SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'create_complete_chat_system_fixed.sql');
    
    if (fs.existsSync(migrationPath)) {
      console.log('✅ Found fixed migration file');
      
      // Try to run the SQL directly using psql if available
      try {
        console.log('🔄 Trying to run SQL directly...');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Create a simple Node.js script to execute the SQL
        // SECURITY: Use proper escaping to prevent command injection
        const escapedSql = sqlContent
          .replace(/\\/g, '\\\\')  // Escape backslashes
          .replace(/'/g, "\\'")    // Escape single quotes
          .replace(/"/g, '\\"')    // Escape double quotes
          .replace(/\$/g, '\\$')   // Escape dollar signs
          .replace(/`/g, '\\`');   // Escape backticks
        
        const escapedPassword = (env.SUPABASE_SERVICE_ROLE_KEY || '')
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"')
          .replace(/\$/g, '\\$')
          .replace(/`/g, '\\`');
        
        const execScript = `
const { execSync } = require('child_process');
const fs = require('fs');

const sql = \`${escapedSql}\`;

// SECURITY: Use proper escaping and avoid shell interpretation
// Try to execute using psql with proper escaping
const password = \`${escapedPassword}\`;
const psqlCommand = ['psql', '-h', 'db.${projectRef}.supabase.co', '-U', 'postgres', '-d', 'postgres', '-p', '5432', '-c', sql];
const env = { ...process.env, PGPASSWORD: password };

try {
  execSync(psqlCommand.join(' '), { 
    stdio: 'inherit',
    env: env,
    shell: false  // Disable shell to prevent injection
  });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.log('❌ PSQL command failed:', error.message);
  process.exit(1);
}
`;
        
        fs.writeFileSync('temp-exec.js', execScript);
        
        try {
          execSync('node temp-exec.js', { stdio: 'inherit', env: envVars });
          console.log('✅ Migration executed successfully!');
        } catch (error) {
          console.log('❌ Direct SQL execution failed:', error.message);
        } finally {
          // Clean up temp file
          if (fs.existsSync('temp-exec.js')) {
            fs.unlinkSync('temp-exec.js');
          }
        }
        
      } catch (error) {
        console.log('❌ SQL execution failed:', error.message);
      }
    } else {
      console.log('❌ Fixed migration file not found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Fallback: Try to use the Supabase dashboard SQL editor approach
    console.log('\n🔄 Fallback: Please manually run the SQL file in Supabase dashboard');
    console.log('1. Go to: https://app.supabase.com/project/' + projectRef + '/sql');
    console.log('2. Copy the contents of: ' + migrationPath);
    console.log('3. Paste it in the SQL editor and run');
    console.log('4. The migration will create all necessary tables, indexes, and policies');
  }
}

// Run the migration
runMigration().catch(console.error);