"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const __dirname = process.cwd();
async function setupDatabase() {
    console.log('📦 Setting up database...\n');
    let connection;
    try {
        connection = await promise_1.default.createConnection({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            multipleStatements: true,
        });
        console.log('✅ Connected to MySQL database');
        const sqlFile = (0, path_1.join)(__dirname, 'api/database/schema-mysql.sql');
        const sql = (0, fs_1.readFileSync)(sqlFile, 'utf8');
        console.log('📄 Executing schema...\n');
        const [results] = await connection.query(sql);
        console.log('\n✅ Database schema executed successfully!');
        console.log('\n📊 Verification:');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`  Tables created: ${tables.length}`);
        const [staffCount] = await connection.query('SELECT COUNT(*) as count FROM staff_members');
        const [youthCount] = await connection.query('SELECT COUNT(*) as count FROM youth_participants');
        const [templateCount] = await connection.query('SELECT COUNT(*) as count FROM contract_templates');
        console.log(`  Staff members: ${staffCount[0].count}`);
        console.log(`  Youth participants: ${youthCount[0].count}`);
        console.log(`  Contract templates: ${templateCount[0].count}`);
        console.log('\n🎉 Database setup complete!\n');
    }
    catch (error) {
        console.error('\n❌ Error setting up database:', error);
        process.exit(1);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
setupDatabase();
//# sourceMappingURL=setup-database.js.map