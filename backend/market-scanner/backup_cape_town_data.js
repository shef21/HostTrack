const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

const BACKUP_DIR = path.join(__dirname, 'backups');

async function backupTable(tableName) {
    console.log(`📦 Backing up ${tableName}...`);
    
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
            
        if (error) throw error;
        
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR);
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `${tableName}_${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        console.log(`✅ Backed up ${data.length} records from ${tableName} to ${backupPath}`);
        
        return backupPath;
    } catch (error) {
        console.error(`❌ Error backing up ${tableName}:`, error);
        throw error;
    }
}

async function backupAllTables() {
    console.log('🚀 Starting backup process...');
    
    const tables = [
        'cape_town_competitors',
        'cape_town_market_data',
        'cape_town_market_trends',
        'cape_town_area_stats'
    ];
    
    const backupPaths = {};
    
    try {
        for (const table of tables) {
            backupPaths[table] = await backupTable(table);
        }
        
        // Save backup metadata
        const metadataPath = path.join(BACKUP_DIR, 'backup_metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            backupPaths,
            tables
        }, null, 2));
        
        console.log('✅ Backup completed successfully!');
        return backupPaths;
    } catch (error) {
        console.error('❌ Backup process failed:', error);
        throw error;
    }
}

// Run backup
backupAllTables();
