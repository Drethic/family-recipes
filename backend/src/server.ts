import app from './app';
import db from './config/database';
import { loadConfig, setConfigInstance } from './config/loadConfig';

// Async server startup to load configuration from Secrets Manager
async function startServer(): Promise<void> {
  try {
    // Load configuration from Secrets Manager or environment variables
    const loadedConfig = await loadConfig();
    setConfigInstance(loadedConfig);

    const PORT = loadedConfig.port;

    // Test database connection
    await db.raw('SELECT 1');
    console.log('✓ Database connection established');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🍳 Family Recipe API Server                              ║
║                                                            ║
║   Environment: ${loadedConfig.nodeEnv.padEnd(43)}║
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

    // Export server for graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown handlers
function setupGracefulShutdown(server: ReturnType<typeof app.listen>): void {
  const gracefulShutdown = async (signal: string): Promise<void> => {
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

  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM').catch(console.error);
  });
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT').catch(console.error);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('✗ Fatal error during startup:', error);
  process.exit(1);
});
