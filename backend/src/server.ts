import app from './app';
import config from './config/env';
import db from './config/database';

const PORT = config.port;

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✓ Database connection established');
  })
  .catch((err) => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🍳 Family Recipe API Server                              ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(43)}║
║   Port: ${PORT.toString().padEnd(50)}║
║   Database: Connected                                      ║
║                                                            ║
║   API Endpoints:                                           ║
║   • http://localhost:${PORT}/api/auth                       ║
║   • http://localhost:${PORT}/api/recipes                    ║
║   • http://localhost:${PORT}/api/users                      ║
║   • http://localhost:${PORT}/api/categories                 ║
║                                                            ║
║   Health Check: http://localhost:${PORT}/health             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✓ HTTP server closed');

    try {
      await db.destroy();
      console.log('✓ Database connections closed');
      process.exit(0);
    } catch (err) {
      console.error('✗ Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('✗ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
