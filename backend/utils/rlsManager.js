const { supabaseAdmin } = require('../config/supabase');

class RLSManager {
  constructor() {
    this.policies = new Map();
    this.initialized = false;
  }

  // Initialize RLS policies for all tables
  async initializeRLS() {
    if (this.initialized) {
      console.log('RLS already initialized');
      return;
    }

    console.log('Initializing RLS policies...');
    
    try {
      // Define all tables and their RLS policies
      const tableConfigs = [
        {
          table: 'profiles',
          ownerColumn: 'id',
          policies: ['select', 'insert', 'update', 'delete']
        },
        {
          table: 'properties',
          ownerColumn: 'owner_id',
          policies: ['select', 'insert', 'update', 'delete']
        },
        {
          table: 'services',
          ownerColumn: 'owner_id',
          policies: ['select', 'insert', 'update', 'delete']
        },
        {
          table: 'bookings',
          ownerColumn: 'owner_id',
          policies: ['select', 'insert', 'update', 'delete']
        },
        {
          table: 'expenses',
          ownerColumn: 'owner_id',
          policies: ['select', 'insert', 'update', 'delete']
        }
      ];

      // Apply policies to each table
      for (const config of tableConfigs) {
        await this.setupTablePolicies(config);
      }

      this.initialized = true;
      console.log('RLS policies initialized successfully');
    } catch (error) {
      console.error('Error initializing RLS:', error);
      throw error;
    }
  }

  // Setup policies for a specific table
  async setupTablePolicies(config) {
    const { table, ownerColumn, policies } = config;
    
    try {
      // Enable RLS on table
      await supabaseAdmin.rpc('enable_rls', { table_name: table });
      
      // Drop existing policies
      await this.dropExistingPolicies(table);
      
      // Create new policies
      for (const policy of policies) {
        await this.createPolicy(table, ownerColumn, policy);
      }
      
      console.log(`RLS policies set up for ${table}`);
    } catch (error) {
      console.error(`Error setting up RLS for ${table}:`, error);
      // Don't throw - continue with other tables
    }
  }

  // Drop existing policies for a table
  async dropExistingPolicies(table) {
    try {
      const { data: existingPolicies } = await supabaseAdmin
        .from('pg_policies')
        .select('policyname')
        .eq('tablename', table);

      for (const policy of existingPolicies || []) {
        await supabaseAdmin.rpc('drop_policy', {
          table_name: table,
          policy_name: policy.policyname
        });
      }
    } catch (error) {
      console.log(`No existing policies to drop for ${table}`);
    }
  }

  // Create a specific policy
  async createPolicy(table, ownerColumn, operation) {
    const policyName = `${table}_${operation}_policy`;
    
    let sql;
    switch (operation) {
      case 'select':
        sql = `CREATE POLICY "${policyName}" ON ${table} FOR SELECT USING (auth.uid() = ${ownerColumn})`;
        break;
      case 'insert':
        sql = `CREATE POLICY "${policyName}" ON ${table} FOR INSERT WITH CHECK (auth.uid() = ${ownerColumn})`;
        break;
      case 'update':
        sql = `CREATE POLICY "${policyName}" ON ${table} FOR UPDATE USING (auth.uid() = ${ownerColumn})`;
        break;
      case 'delete':
        sql = `CREATE POLICY "${policyName}" ON ${table} FOR DELETE USING (auth.uid() = ${ownerColumn})`;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    try {
      await supabaseAdmin.rpc('exec_sql', { sql });
      console.log(`Created policy ${policyName} for ${table}`);
    } catch (error) {
      console.error(`Error creating policy ${policyName}:`, error);
    }
  }

  // Add a new table to RLS management
  async addTable(table, ownerColumn = 'owner_id') {
    const config = {
      table,
      ownerColumn,
      policies: ['select', 'insert', 'update', 'delete']
    };
    
    await this.setupTablePolicies(config);
    console.log(`Added ${table} to RLS management`);
  }

  // Get current RLS status
  async getRLSStatus() {
    try {
      const { data, error } = await supabaseAdmin
        .from('pg_policies')
        .select('schemaname, tablename, policyname, cmd')
        .order('tablename, policyname');

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting RLS status:', error);
      return [];
    }
  }
}

// Create singleton instance
const rlsManager = new RLSManager();

module.exports = rlsManager; 