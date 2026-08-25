const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();

const BASE_URL = process.env.BASE_URL || 'https://spider-avik.zone.id'; 

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    
    // Using Buffer directly with form-data package which Catbox officially supports
    form.append('fileToUpload', req.file.buffer, {
      filename: req.file.originalname || 'media_file.bin',
      contentType: req.file.mimetype
    });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    const catboxUrl = response.data;
    const filename = typeof catboxUrl === 'string' ? catboxUrl.trim().split('/').pop() : '';

    if (!filename) {
      throw new Error('Invalid response from Catbox API');
    }

    res.json({
      success: true,
      url: `${BASE_URL}/file/${filename}`,
      original_name: req.file.originalname
    });

  } catch (err) {
    console.error('Upload Error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to upload to external server', 
      details: err.response?.data || err.message 
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

module.exports = app;
