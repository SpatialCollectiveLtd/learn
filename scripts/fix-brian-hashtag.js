// Fix Brian Karani's stats - accept his hotosm hashtag for that specific changeset
// Then re-calculate his building count including the missed changeset
import dotenv from 'dotenv';
import { Client } from 'pg';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';

async function fixBrianStats() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const youthId = 'KAY251BK';
    const osmUsername = 'BrianKarani';
    
    // 1. Add exception configuration for Brian to accept both hashtags
    console.log('🔧 Adding hashtag exception for Brian Karani...');
    
    await client.query(`
      INSERT INTO youth_participants (youth_id, exception_hashtags)
      VALUES ($1, ARRAY['#hotosm-project-36570'])
      ON CONFLICT (youth_id) 
      DO UPDATE SET 
        exception_hashtags = ARRAY['#hotosm-project-36570'],
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_participants.youth_id = $1
    `, [youthId]).catch(async (err) => {
      // Column might not exist, add it
      console.log('📝 Adding exception_hashtags column...');
      await client.query(`
        ALTER TABLE youth_participants 
        ADD COLUMN IF NOT EXISTS exception_hashtags TEXT[]
      `);
      
      await client.query(`
        UPDATE youth_participants
        SET exception_hashtags = ARRAY['#hotosm-project-36570']
        WHERE youth_id = $1
      `, [youthId]);
    });
    
    console.log('✅ Exception hashtag added for Brian\n');

    // 2. Fetch and count buildings from the specific changeset
    console.log('🔍 Fetching changeset #176975712...');
    
    const changesetId = 176975712;
    const csUrl = `${OSM_API_BASE}/changeset/${changesetId}/download`;
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '_text',
      parseAttributeValue: true,
      isArray: (name) => ['changeset', 'node', 'way', 'relation', 'tag'].includes(name),
    });

    const csResponse = await axios.get(csUrl, {
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0',
        'Accept': 'text/xml',
      },
      timeout: 30000,
    });

    const csParsed = parser.parse(csResponse.data);
    const osmChange = csParsed?.osmChange || {};
    
    let buildingCount = 0;
    const typos = ['biulding', 'buiding', 'buidling', 'buliding', 'buidilng'];

    // Check all modification types
    for (const modType of ['create', 'modify', 'delete']) {
      const elements = osmChange[modType];
      if (!elements) continue;

      // Check nodes, ways, relations
      for (const elementType of ['node', 'way', 'relation']) {
        const items = Array.isArray(elements[elementType]) ? elements[elementType] : 
                      elements[elementType] ? [elements[elementType]] : [];
        
        for (const item of items) {
          if (!item.tag) continue;
          
          const tags = Array.isArray(item.tag) ? item.tag : [item.tag];
          
          // Check for building tag or typos
          const hasBuilding = tags.some(tag => 
            tag.k === 'building' || typos.includes(tag.k)
          );
          
          if (hasBuilding) {
            buildingCount++;
          }
        }
      }
    }

    console.log(`📊 Changeset #${changesetId}: ${buildingCount} buildings found\n`);

    // 3. Re-calculate total for Jan 8
    const today = '2026-01-08';
    
    // Get existing count (from the #DPW2025 changesets)
    const existingResult = await client.query(`
      SELECT buildings_mapped FROM youth_osm_stats
      WHERE youth_id = $1 AND date = $2
    `, [youthId, today]);
    
    const existingBuildings = existingResult.rows[0]?.buildings_mapped || 0;
    const newTotal = existingBuildings + buildingCount;
    
    console.log(`📈 Stats update:`);
    console.log(`   Previous count (Jan 8): ${existingBuildings} buildings`);
    console.log(`   + Recovered from changeset #${changesetId}: ${buildingCount} buildings`);
    console.log(`   = NEW TOTAL: ${newTotal} buildings\n`);

    // 4. Update OSM stats
    await client.query(`
      UPDATE youth_osm_stats
      SET buildings_mapped = $1,
          changesets_analyzed = changesets_analyzed + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $2 AND date = $3
    `, [newTotal, youthId, today]);

    // 5. Update work day
    const dailyTarget = 200;
    const targetMet = newTotal >= dailyTarget;
    
    await client.query(`
      UPDATE youth_work_days
      SET buildings_count = $1,
          target_met = $2,
          notes = 'Updated to include changeset #176975712 with exception hashtag #hotosm-project-36570',
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $3 AND work_date = $4
    `, [newTotal, targetMet, youthId, today]);

    console.log('✅ Stats and work day updated\n');

    // 6. Create notification for Brian
    console.log('📢 Creating notification for Brian...');
    
    // Create notifications table if doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS youth_notifications (
        notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        youth_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        is_hidden BOOLEAN DEFAULT FALSE,
        auto_expire_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_youth ON youth_notifications(youth_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_hidden ON youth_notifications(is_hidden);
      CREATE INDEX IF NOT EXISTS idx_notifications_expire ON youth_notifications(auto_expire_at);
    `);

    // Insert notification (expires in 3 days)
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 3);
    
    await client.query(`
      INSERT INTO youth_notifications (
        youth_id, 
        title, 
        message, 
        type,
        auto_expire_at
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      youthId,
      'Important: Hashtag Reminder',
      `Hi Brian! We noticed you used #hotosm-project-36570 in changeset #176975712. We've recovered your ${buildingCount} buildings from that changeset, but please ALWAYS use #DPW2025 for all future work. Only work with the correct hashtag will be counted automatically. This is a one-time exception for you!`,
      'warning',
      expireDate
    ]);

    console.log('✅ Notification created (expires in 3 days)\n');

    // 7. Verification
    console.log('🔍 Final verification:');
    const verifyStats = await client.query(`
      SELECT date, buildings_mapped, changesets_analyzed
      FROM youth_osm_stats
      WHERE youth_id = $1 AND date = $2
    `, [youthId, today]);

    const verifyWorkDay = await client.query(`
      SELECT work_date, buildings_count, target_met, status
      FROM youth_work_days
      WHERE youth_id = $1 AND work_date = $2
    `, [youthId, today]);

    console.log('OSM Stats:');
    console.log(`  Date: ${verifyStats.rows[0].date}`);
    console.log(`  Buildings: ${verifyStats.rows[0].buildings_mapped}`);
    console.log(`  Changesets: ${verifyStats.rows[0].changesets_analyzed}`);
    
    console.log('\nWork Day:');
    console.log(`  Date: ${verifyWorkDay.rows[0].work_date}`);
    console.log(`  Buildings: ${verifyWorkDay.rows[0].buildings_count}`);
    console.log(`  Target Met: ${verifyWorkDay.rows[0].target_met ? '✅ YES' : '❌ NO'}`);
    console.log(`  Status: ${verifyWorkDay.rows[0].status}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ BRIAN KARANI STATS FIXED');
    console.log('='.repeat(80));
    console.log(`Exception hashtag added: #hotosm-project-36570`);
    console.log(`Buildings recovered: ${buildingCount}`);
    console.log(`New total for Jan 8: ${newTotal} buildings`);
    console.log(`Notification created: 3-day warning about correct hashtag`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixBrianStats();
