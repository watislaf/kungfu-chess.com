import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { SocketController } from './app/controllers/SocketController';
import path from 'path';
import fs from 'fs';

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('📍 Stack trace:', error.stack);
  // Don't exit in production to maintain service
  if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Exiting due to uncaught exception in development');
    process.exit(1);
  } else {
    console.error('⚠️  Continuing execution in production (not recommended)');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  // Don't exit in production to maintain service
  if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Exiting due to unhandled rejection in development');
    process.exit(1);
  } else {
    console.error('⚠️  Continuing execution in production (not recommended)');
  }
});

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3001');

const app = express();
const server = createServer(app);

// Initialize Socket.IO with error handling
let socketController: SocketController;
try {
  socketController = new SocketController(server);
  console.log('🔌 Socket.IO initialized with SocketController');
} catch (error) {
  console.error('❌ Failed to initialize SocketController:', error);
  process.exit(1);
}

if (dev) {
  // Development mode: Only run Socket.IO server
  console.log('🔧 Development mode: Socket.IO only');
  console.log('📝 Run "npx next dev" separately for Next.js frontend');
} else {
  // Production mode: Serve static files + Socket.IO
  console.log('🚀 Production mode: Static files + Socket.IO');
  
  const staticDir = path.join(__dirname, '..', 'out');
  console.log('📁 Serving static files from /out directory');
  
  if (!fs.existsSync(staticDir)) {
    console.error('❌ Static directory not found:', staticDir);
    console.error('❌ Please run "npm run build" first');
    process.exit(1);
  }
  
  // Serve static files
  app.use(express.static(staticDir, {
    maxAge: '1d',
    etag: true,
    index: 'index.html'
  }));
  
  // Handle SPA routing by serving index.html for unmatched routes
  app.use((req: Request, res: Response) => {
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <html>
          <head><title>App Not Built</title></head>
          <body>
            <h1>Application Not Built</h1>
            <p>Please run <code>npm run build</code> first.</p>
            <p>Then run <code>npm run start</code></p>
          </body>
        </html>
      `);
    }
  });
}

// Start server
server.listen(port, '0.0.0.0', () => {
  if (dev) {
    console.log(`🔌 Socket.IO server running on http://localhost:${port}`);
    console.log('🔌 Socket.IO server running with TypeScript SocketController');
    console.log('📝 Run "npx next dev" on port 3000 for the frontend');
  } else {
    console.log(`🌐 Production server running on http://0.0.0.0:${port}`);
    console.log(`🔌 Socket.IO server running on http://0.0.0.0:${port}`);
    console.log('🔌 Socket.IO server running with TypeScript SocketController');
  }
});

export { socketController }; 