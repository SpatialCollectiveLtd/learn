import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import youthAuthRoutes from './routes/youthAuth';
import staffAuthRoutes from './routes/staffAuth';
import contractRoutes from './routes/contracts';

// Import database
import { Database } from './config/database';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

// Serve static files (uploaded PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Spatial Collective API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/youth/auth', authLimiter, youthAuthRoutes);
app.use('/api/staff/auth', authLimiter, staffAuthRoutes);
app.use('/api/contracts', contractRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// START SERVER
// ============================================================================

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

  // Test database connection
  try {
    await Database.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please check your database configuration in .env file\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await Database.close();
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(async () => {
    await Database.close();
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
