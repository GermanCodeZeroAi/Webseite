import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailAgent } from './services/EmailAgent.js';
import { ApiController } from './controllers/ApiController.js';

// Load environment variables
dotenv.config();

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Email Agent
const emailAgent = new EmailAgent();

// Initialize API Controller
const apiController = new ApiController(emailAgent);

// Mount API routes
app.use('/api', apiController.router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'E-Commerce Email Agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting E-Commerce Email Agent...');
    
    // Initialize the email agent
    const initialized = await emailAgent.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize Email Agent');
      process.exit(1);
    }
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard available at http://localhost:${PORT}`);
      console.log(`🔌 API endpoints available at http://localhost:${PORT}/api`);
      
      // Auto-start email agent if configured
      if (process.env.AUTO_START_AGENT === 'true') {
        emailAgent.start(parseInt(process.env.CHECK_INTERVAL) || 60000)
          .then(() => console.log('✅ Email Agent started automatically'))
          .catch(err => console.error('❌ Failed to auto-start agent:', err));
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await emailAgent.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  try {
    await emailAgent.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();

// Export for testing
export default app;