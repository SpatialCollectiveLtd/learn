/**
 * Multi-Module Assignment Management Script
 * Purpose: Test and manage youth module transitions during 20-day work period
 * 
 * Features:
 * - List youth eligible for module transitions
 * - Transition youth between modules 
 * - View assignment history
 * - Check work period progress across modules
 * 
 * Usage:
 * node scripts/manage-module-assignments.js --action=list_eligible
 * node scripts/manage-module-assignments.js --action=transition --youth_id=KAY1234 --new_module=microtasking --date=2026-02-05
 * node scripts/manage-module-assignments.js --action=history --youth_id=KAY1234
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

async function listEligibleYouth() {
  console.log('\n📋 YOUTH ELIGIBLE FOR MODULE TRANSITIONS\n');
  console.log('=' .repeat(100));
  
  const result = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.settlement, 
      yp.program_type as current_program,
      
      -- Current assignment
      (SELECT program_type FROM get_active_module_assignment(yp.youth_id)) as active_assignment,
      (SELECT start_date FROM get_active_module_assignment(yp.youth_id)) as assignment_start,
      
      -- Work progress
      COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0) as work_days,
      GREATEST(0, 20 - COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0)) as remaining_days,
      
      -- Assignment count
      (SELECT COUNT(*) FROM youth_module_assignments WHERE youth_id = yp.youth_id) as assignment_count,
      
      -- Training completion for current module
      CASE 
        WHEN yp.program_type = 'digitization' THEN 
          (SELECT COUNT(DISTINCT step_id) FROM youth_training_progress 
           WHERE youth_id = yp.youth_id AND module_type IN ('mapper', 'validator'))
        WHEN yp.program_type = 'mobile_mapping' THEN
          (SELECT COUNT(DISTINCT step_id) FROM youth_training_progress 
           WHERE youth_id = yp.youth_id AND module_type = 'mobile_mapping')
        WHEN yp.program_type = 'microtasking' THEN
          (SELECT COUNT(DISTINCT step_id) FROM youth_training_progress 
           WHERE youth_id = yp.youth_id AND module_type LIKE 'microtasking%')
        ELSE 0
      END as training_steps
      
    FROM youth_participants yp
    WHERE yp.is_active = TRUE
    AND COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0) < 20
    ORDER BY yp.settlement, work_days DESC, yp.youth_id
  `);

  // Group by settlement for better display
  const bySettlement = result.rows.reduce((acc, youth) => {
    if (!acc[youth.settlement]) acc[youth.settlement] = [];
    acc[youth.settlement].push(youth);
    return acc;
  }, {});

  let totalEligible = 0;

  for (const [settlement, youth] of Object.entries(bySettlement)) {
    console.log(`\n🏘️  ${settlement.toUpperCase()}`);
    console.log('-'.repeat(80));
    
    youth.forEach((y, index) => {
      const status = y.assignment_count > 1 ? '🔄 MULTI-MODULE' : '📍 SINGLE MODULE';
      const workStatus = y.work_days > 0 ? `${y.work_days} days worked` : 'No work days yet';
      const trainingStatus = y.training_steps > 0 ? `${y.training_steps} training steps` : 'No training';
      
      console.log(`${index + 1}.`.padEnd(4) + 
                  `${y.youth_id}`.padEnd(12) + 
                  `${y.full_name || 'NO NAME'}`.padEnd(25) + 
                  `${y.current_program}`.padEnd(18) + 
                  `${workStatus}`.padEnd(18) + 
                  `${trainingStatus}`.padEnd(18) + 
                  `${status}`);
      
      if (y.current_program !== y.active_assignment) {
        console.log(`    ⚠️  Program mismatch: Current=${y.current_program}, Active=${y.active_assignment}`);
      }
      
      totalEligible++;
    });
  }

  console.log('\n' + '='.repeat(100));
  console.log(`📊 SUMMARY: ${totalEligible} youth eligible for module transitions`);
  console.log(`   - Youth with work days: ${result.rows.filter(y => y.work_days > 0).length}`);
  console.log(`   - Multi-module youth: ${result.rows.filter(y => y.assignment_count > 1).length}`);
  console.log(`   - Remaining work capacity: ${result.rows.reduce((sum, y) => sum + y.remaining_days, 0)} total days`);
  
  return result.rows;
}

async function getAssignmentHistory(youthId) {
  console.log(`\n📋 ASSIGNMENT HISTORY FOR ${youthId}\n`);
  console.log('=' .repeat(80));
  
  const result = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.settlement,
      yp.program_type as current_program,
      
      -- Assignment history
      yma.assignment_id,
      yma.program_type,
      yma.start_date,
      yma.end_date,
      yma.is_active,
      yma.assigned_by,
      yma.assignment_notes,
      
      -- Work days for this assignment period
      (SELECT COUNT(*) 
       FROM youth_work_days ywd 
       WHERE ywd.youth_id = yma.youth_id
       AND ywd.work_date >= yma.start_date 
       AND (yma.end_date IS NULL OR ywd.work_date <= yma.end_date)
       AND ywd.status = 'approved') as work_days_in_period
      
    FROM youth_participants yp
    LEFT JOIN youth_module_assignments yma ON yp.youth_id = yma.youth_id
    WHERE yp.youth_id = $1 AND yp.is_active = TRUE
    ORDER BY yma.start_date DESC
  `, [youthId.toUpperCase()]);

  if (result.rows.length === 0) {
    console.log(`❌ Youth ${youthId} not found or not active`);
    return;
  }

  const youth = result.rows[0];
  console.log(`👤 ${youth.full_name} (${youth.youth_id})`);
  console.log(`🏘️  Settlement: ${youth.settlement}`);
  console.log(`📍 Current Program: ${youth.current_program}`);
  console.log('');

  // Get total work statistics
  const workStats = await pool.query(`
    SELECT 
      COUNT(*) as total_work_days,
      COUNT(*) FILTER (WHERE target_met = TRUE) as target_met_days,
      SUM(buildings_count) as total_buildings,
      AVG(buildings_count) as avg_buildings
    FROM youth_work_days
    WHERE youth_id = $1 AND status = 'approved'
  `, [youthId.toUpperCase()]);

  const stats = workStats.rows[0];
  console.log('📊 OVERALL WORK STATISTICS:');
  console.log(`   Total Work Days: ${stats.total_work_days}/20`);
  console.log(`   Days Meeting Target: ${stats.target_met_days}`);
  console.log(`   Total Buildings: ${stats.total_buildings || 0}`);
  console.log(`   Average per Day: ${Math.round(stats.avg_buildings || 0)}`);
  console.log('');

  console.log('🔄 MODULE ASSIGNMENT HISTORY:');
  console.log('-'.repeat(80));

  result.rows.forEach((assignment, index) => {
    if (!assignment.assignment_id) {
      console.log('   No assignment history found');
      return;
    }

    const status = assignment.is_active ? '🟢 ACTIVE' : '⚪ ENDED';
    const period = assignment.end_date 
      ? `${assignment.start_date} to ${assignment.end_date}`
      : `${assignment.start_date} to present`;
    
    console.log(`${index + 1}. ${assignment.program_type.toUpperCase()} ${status}`);
    console.log(`   Period: ${period}`);
    console.log(`   Work Days: ${assignment.work_days_in_period}`);
    
    if (assignment.assigned_by) {
      console.log(`   Assigned By: ${assignment.assigned_by}`);
    }
    
    if (assignment.assignment_notes) {
      console.log(`   Notes: ${assignment.assignment_notes}`);
    }
    console.log('');
  });

  return result.rows;
}

async function transitionYouth(youthId, newModule, transitionDate, notes) {
  console.log(`\n🔄 TRANSITIONING ${youthId} TO ${newModule.toUpperCase()}\n`);
  console.log('=' .repeat(60));
  
  try {
    // Check current status
    const currentStatus = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type as current_program,
        (SELECT program_type FROM get_active_module_assignment(yp.youth_id)) as active_assignment,
        (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved') as work_days
      FROM youth_participants yp
      WHERE yp.youth_id = $1 AND yp.is_active = TRUE
    `, [youthId.toUpperCase()]);

    if (currentStatus.rows.length === 0) {
      console.log(`❌ Youth ${youthId} not found or not active`);
      return;
    }

    const youth = currentStatus.rows[0];
    console.log(`👤 Youth: ${youth.full_name} (${youth.youth_id})`);
    console.log(`📍 Current: ${youth.current_program} → ${newModule}`);
    console.log(`📊 Work Days Completed: ${youth.work_days}/20`);
    console.log(`📅 Transition Date: ${transitionDate}`);
    console.log('');

    if (youth.work_days >= 20) {
      console.log(`❌ Cannot transition: Youth has completed 20-day work period`);
      return;
    }

    if (youth.current_program === newModule) {
      console.log(`❌ Cannot transition: Youth already assigned to ${newModule}`);
      return;
    }

    // Perform transition
    console.log('🔄 Processing transition...');
    const transitionResult = await pool.query(`
      SELECT transition_youth_module($1, $2, $3, $4, $5) as new_assignment_id
    `, [
      youthId.toUpperCase(),
      newModule,
      transitionDate,
      'STAFF_SCRIPT', // Staff ID placeholder
      notes || `Script transition from ${youth.current_program} to ${newModule}`
    ]);

    const newAssignmentId = transitionResult.rows[0].new_assignment_id;
    
    console.log(`✅ Transition successful!`);
    console.log(`   New Assignment ID: ${newAssignmentId}`);
    console.log(`   Previous Module: ${youth.current_program}`);
    console.log(`   New Module: ${newModule}`);
    console.log(`   Remaining Work Days: ${20 - youth.work_days}`);
    
    // Show updated assignment history
    console.log('\n📋 Updated assignment history:');
    await getAssignmentHistory(youthId);

  } catch (error) {
    console.error(`❌ Transition failed:`, error.message);
    
    if (error.message.includes('settlement')) {
      console.log(`\n💡 Tip: Ensure settlement has work configuration for ${newModule}`);
      console.log(`   Check: SELECT * FROM settlement_work_config WHERE program_type = '${newModule}'`);
    }
  }
}

async function checkSettlementConfigs() {
  console.log('\n⚙️  SETTLEMENT WORK CONFIGURATIONS\n');
  console.log('=' .repeat(80));
  
  const configs = await pool.query(`
    SELECT 
      settlement,
      program_type,
      start_date,
      total_work_days,
      daily_target,
      project_hashtag,
      is_active
    FROM settlement_work_config
    ORDER BY settlement, program_type
  `);

  const bySettlement = configs.rows.reduce((acc, config) => {
    if (!acc[config.settlement]) acc[config.settlement] = [];
    acc[config.settlement].push(config);
    return acc;
  }, {});

  for (const [settlement, configs] of Object.entries(bySettlement)) {
    console.log(`\n🏘️  ${settlement}`);
    console.log('-'.repeat(50));
    
    configs.forEach(config => {
      const status = config.is_active ? '✅' : '❌';
      console.log(`   ${status} ${config.program_type.padEnd(18)} | ${config.daily_target} target | ${config.total_work_days} days | Start: ${config.start_date}`);
    });
  }
}

async function main() {
  try {
    console.log('🎯 Multi-Module Assignment Management');
    console.log('=====================================');
    
    const action = args.action || 'list_eligible';
    
    switch (action) {
      case 'list_eligible':
      case 'list':
        await listEligibleYouth();
        break;
        
      case 'history':
        if (!args.youth_id) {
          console.log('❌ --youth_id required for history action');
          console.log('   Example: --action=history --youth_id=KAY1234');
          break;
        }
        await getAssignmentHistory(args.youth_id);
        break;
        
      case 'transition':
        if (!args.youth_id || !args.new_module) {
          console.log('❌ --youth_id and --new_module required for transition');
          console.log('   Example: --action=transition --youth_id=KAY1234 --new_module=microtasking --date=2026-02-05');
          break;
        }
        const transitionDate = args.date || new Date().toISOString().split('T')[0];
        await transitionYouth(args.youth_id, args.new_module, transitionDate, args.notes);
        break;
        
      case 'configs':
        await checkSettlementConfigs();
        break;
        
      default:
        console.log('❌ Invalid action. Available actions:');
        console.log('   --action=list_eligible    List youth eligible for transitions');
        console.log('   --action=history          View assignment history (requires --youth_id)');
        console.log('   --action=transition       Transition youth (requires --youth_id --new_module)');
        console.log('   --action=configs          Show settlement configurations');
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  } finally {
    await pool.end();
  }
}

// Handle script execution
if (require.main === module) {
  main();
}