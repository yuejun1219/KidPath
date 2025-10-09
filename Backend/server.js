require('dotenv').config();

// Debug: Log environment variables at startup
console.log('🔍 [DEBUG] Server startup - Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '❌未设置');
console.log('AMEN_DB_NAME:', process.env.AMEN_DB_NAME);
console.log('AMEN_DB_PASSWORD:', process.env.AMEN_DB_PASSWORD ? '***已设置***' : '❌未设置');

const aiRoutes = require("./src/routes/aiRoutes");
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const { testConnection, closePool } = require('./src/config/database');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { DEFAULT_CONFIG } = require('./src/utils/constants');
const logger = require('./src/utils/logger');
const playgrRoutes = require('./src/routes/playgr');  
// const logger = require('./src/utils/logger'); // Temporarily disabled for debugging

const app = express();
const port = process.env.PORT || DEFAULT_CONFIG.PORT;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://www.kidpath.me',
    'https://kidpath.me',
    'https://api.kidpath.me'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Cache-Control',
    'Pragma',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 600
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// routes
app.use('/', routes);

// error handlers
app.use(notFoundHandler);
app.use(errorHandler);
app.use('/playgr', playgrRoutes);  

// start server
const startServer = async () => {
  try {
    // test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('Database connection failed');
    } else {
      console.log('Database connected successfully');
    }

    // start express server
    const server = app.listen(port, () => {
      console.log('Seasonal Comfort API server started', {
        port: port,
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: `http://localhost:${port}/health`,
          healthDetailed: `http://localhost:${port}/health/detailed`,
          summerData: `http://localhost:${port}/api/v1/seasonal-comfort?season=summer`,
          winterData: `http://localhost:${port}/api/v1/seasonal-comfort?season=winter`,
          statistics: `http://localhost:${port}/api/v1/statistics`
        }
      });
      
      // during development
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n=================================');
        console.log(`   Seasonal Comfort API server started`);
        console.log('=================================');
        console.log(`server on: http://localhost:${port}`);
        console.log(`health test: http://localhost:${port}/health`);
        console.log(`advanced health test: http://localhost:${port}/health/detailed`);
        console.log(`summer data: http://localhost:${port}/api/v1/seasonal-comfort?season=summer`);
        console.log(`winter data: http://localhost:${port}/api/v1/seasonal-comfort?season=winter`);
        console.log(`statistics: http://localhost:${port}/api/v1/statistics`);
        console.log('=================================\n');
      }
    });

    // graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal} signal, shutting down...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await closePool();
          console.log('Database pool closed');
          process.exit(0);
        } catch (error) {
          console.error('Graceful shutdown failed', { error: error.message });
          process.exit(1);
        }
      });

      // force exit if not closed in time
      setTimeout(() => {
        console.error('Forcing shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled promise rejection', { 
        reason: reason?.message || reason, 
        stack: reason?.stack,
        promise: promise.toString()
      });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Server start failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// start the server
startServer();

module.exports = app;