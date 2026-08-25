const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Your custom domain or Vercel URL
const BASE_URL = process.env.BASE_URL || 'https://spider-avik.zone.id'; 

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Vercel serverless environment er jonno native FormData & Blob use kora holo
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    
    const blob = new Blob([req.file.buffer]);
    form.append('fileToUpload', blob, req.file.originalname || 'media_file.bin');

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error('Catbox server returned an error');
    }

    const catboxUrl = await response.text();
    const filename = catboxUrl.trim().split('/').pop();

    if (!filename) {
      throw new Error('Invalid filename received from Catbox');
    }

    res.json({
      success: true,
      url: `${BASE_URL}/file/${filename}`,
      original_name: req.file.originalname
    });

  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to upload to external server', 
      details: err.message 
    });
  }
});

// 🔄 Proxy Endpoint for Viewing Files
app.get('/file/:filename', async (req, res) => {
  try {
    const catboxUrl = `https://files.catbox.moe/${req.params.filename}`;

    const response = await axios({
      method: 'GET',
      url: catboxUrl,
      responseType: 'stream', 
    });

    res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    response.data.pipe(res);

  } catch (err) {
    console.error('File Fetch Error:', err.message);
    res.status(404).send('File not found or deleted.');
  }
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Spider Media API is running perfectly on Vercel!');
});

// Vercel er jonno eta export kortei hobe
module.exports = app;
