const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into smaller statements that Supabase can handle
    const statements = schemaSql.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log(`Executing SQL: ${stmt.substring(0, 50)}...`);
        
        // Execute the SQL through Supabase's REST API
        const { error } = await supabase.rpc('pg_query', { query: stmt });
        
        if (error) {
          // Just log errors but continue - some may be "already exists" errors
          console.error('Error executing SQL statement:', error);
        }
      }
    }
    
    console.log('Database initialization completed!');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();