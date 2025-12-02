import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Using 3001 as default to avoid permission issues with port 80 on local dev
const PORT = process.env.PORT || 3001; 
const DATA_DIR = process.env.DATA_DIR || './data';
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// Ensure db file exists
if (!fs.existsSync(DATA_FILE)) {
  try {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  } catch (err) {
    console.error("Failed to create db file:", err);
  }
}

// Middleware
app.use(express.json({ limit: '50mb' })); // Allow large payloads for imports
app.use(express.static(path.join(__dirname, 'dist'))); // Serve React Build

// API Routes
app.get('/api/data', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
        return res.json([]);
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data || '[]'));
  } catch (error) {
    console.error("Error reading DB:", error);
    res.status(500).json({ error: "Failed to read database" });
  }
});

app.post('/api/data', (req, res) => {
  try {
    // Write to disk
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Error writing DB:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// SPA Fallback - Send index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ResearchVault Server running on port ${PORT}`);
  console.log(`Data stored in: ${DATA_FILE}`);
});