// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes');
const socketManager = require('./socket');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// ========================================================
// 🛠️ TEMPORARY MANUAL BACKDOOR SEED ROUTE
// ========================================================
app.get('/api/force-seed-database-xyz', async (req, res) => {
  try {
    console.log("========================================");
    console.log("MANUAL TRIGGER: Forcing database seed...");
    console.log("========================================");
    
    // Calls connectDB again which inherently runs the fresh seed function
    await db.connectDB(); 
    
    return res.status(200).json({ 
      success: true, 
      message: "Database seed function forced successfully! Check Render logs to see inserted records." 
    });
  } catch (error) {
    console.error("Manual seed route crashed:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Mount standard API routes
app.use('/api', apiRoutes);

// Serve static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to React SPA index.html for unknown routes
app.get(/.*/, (req, res) => {
  // If request is under /api, return 404 rather than static HTML
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  
  // Serve the index.html if dist exists
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If client build doesn't exist, provide a helpful development message
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Chess Freaks Dev Backend</title></head>
        <body style="font-family: sans-serif; background: #0a0a0c; color: #fff; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh;">
          <h1>Chess Freaks Backend is running on port ${PORT}!</h1>
          <p>The React client build was not found. If you are developing, please run <strong>npm run dev</strong> in the project root to start both the Express API and Vite frontend.</p>
        </body>
        </html>
      `);
    }
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSockets server
socketManager.initSocket(server);

// Start listening after database connection is active
async function startServer() {
  // 1. Start listening on the port immediately so Vite can connect
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`   Chess Freaks Server running on PORT: ${PORT}`);
    console.log(`   WebSockets attached path: /ws`);
    console.log(`========================================`);
  });

  // 2. Connect to the database asynchronously in the background
  try {
    console.log("Attempting background database connection...");
    await db.connectDB();
    console.log("MongoDB Connected Successfully!");
  } catch (e) {
    console.error("CRITICAL: Failed to connect to MongoDB in background.", e);
  }
}

startServer();