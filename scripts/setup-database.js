import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  try {
    // Enable RLS
    await supabase.rpc('alter_table_enable_rls', { table_name: 'users' });

    // Create policies
    await supabase.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'Users can view own data',
      policy_definition: 'auth.uid() = id',
      command: 'SELECT'
    });

    await supabase.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'Users can update own data',
      policy_definition: 'auth.uid() = id',
      command: 'UPDATE'
    });

    await supabase.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'Users can insert own data',
      policy_definition: 'auth.uid() = id',
      command: 'INSERT'
    });

    await supabase.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'Service role can do anything',
      policy_definition: 'current_user = \'service_role\'',
      command: 'ALL'
    });

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();