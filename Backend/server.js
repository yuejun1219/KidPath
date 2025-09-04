
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const { testConnection, closePool } = require('./src/config/database');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { DEFAULT_CONFIG } = require('./src/utils/constants');

const app = express();
const port = process.env.PORT || DEFAULT_CONFIG.PORT;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url}`);
  next();
});

// routes
app.use('/', routes);

// error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// start server
const startServer = async () => {
  try {
    // test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('connect to database failed');
    }

    // start express server
    const server = app.listen(port, () => {
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
    });

    // graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\nreceive ${signal} signal, shutting down...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await closePool();
          console.log('Database pool closed');
          process.exit(0);
        } catch (error) {
          console.error('closed failed:', error);
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
      console.error('uncaught error:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('unhandled Promise rejection:', reason, 'at Promise:', promise);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('server start failed:', error);
    process.exit(1);
  }
};

// start the server
startServer();

module.exports = app;