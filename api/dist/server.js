"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const youthAuth_1 = __importDefault(require("./routes/youthAuth"));
const staffAuth_1 = __importDefault(require("./routes/staffAuth"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
});
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Spatial Collective API is running',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/youth/auth', authLimiter, youthAuth_1.default);
app.use('/api/staff/auth', authLimiter, staffAuth_1.default);
app.use('/api/contracts', contracts_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = app.listen(PORT, async () => {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║                                                           ║');
        console.log('║       🚀 Spatial Collective API Server Started           ║');
        console.log('║                                                           ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log(`║  Port:        ${PORT.toString().padEnd(44)}║`);
        console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)}║`);
        console.log(`║  API URL:     http://localhost:${PORT.toString().padEnd(32)}║`);
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  Available Endpoints:                                     ║');
        console.log('║  • GET  /health                                           ║');
        console.log('║  • POST /api/youth/auth/authenticate                      ║');
        console.log('║  • POST /api/staff/auth/authenticate                      ║');
        console.log('║  • GET  /api/contracts/template                           ║');
        console.log('║  • POST /api/contracts/sign                               ║');
        console.log('║  • GET  /api/contracts/signed                             ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');
        try {
            await database_1.Database.query('SELECT NOW()');
            console.log('✅ Database connection successful\n');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            console.error('Please check your database configuration in .env file\n');
        }
    });
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(async () => {
            await database_1.Database.close();
            console.log('Process terminated');
            process.exit(0);
        });
    });
    process.on('SIGINT', async () => {
        console.log('\nSIGINT received, shutting down gracefully...');
        server.close(async () => {
            await database_1.Database.close();
            console.log('Process terminated');
            process.exit(0);
        });
    });
}
//# sourceMappingURL=server.js.map