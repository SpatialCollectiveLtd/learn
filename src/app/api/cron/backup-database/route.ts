import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';



const CRITICAL_TABLES = [
  'youth_participants',
  'attendance_records',
  'youth_work_days',
  'youth_work_summary',
  'youth_osm_stats',
  'youth_training_progress',
  'signed_contracts',
  'contract_templates',
  'staff_members',
  'settlement_work_config'
];

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    
    const timestamp = new Date().toISOString();
    const backupData: any = {
      timestamp,
      version: '2.0',
      requestId,
      tables: {}
    };

    let totalRows = 0;
    let successCount = 0;
    let errorCount = 0;

    
    for (const table of CRITICAL_TABLES) {
      try {
        const result = await Database.query(`SELECT * FROM ${table}`);
        backupData.tables[table] = {
          rowCount: result.rows.length,
          success: true,
          
          sampleRow: result.rows[0] || null
        };
        totalRows += result.rows.length;
        successCount++;
        
      } catch (error: any) {
        backupData.tables[table] = {
          rowCount: 0,
          success: false,
          error: error.message
        };
        errorCount++;
        
      }
    }

    const duration = Date.now() - startTime;

    
    
    
    return NextResponse.json({
      success: true,
      message: 'Database backup completed',
      timestamp,
      requestId,
      stats: {
        tablesBackedUp: successCount,
        tablesWithErrors: errorCount,
        totalRows,
        durationMs: duration
      },
      tables: Object.keys(backupData.tables).map(table => ({
        name: table,
        rowCount: backupData.tables[table].rowCount,
        success: backupData.tables[table].success
      }))
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      message: 'Backup failed',
      error: error.message,
      requestId,
      durationMs: duration
    }, { status: 500 });
  }
}
