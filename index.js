const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Your custom domain or Render URL is set here
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
    
    // Sending the filename with the buffer is required by the Catbox API
    form.append('fileToUpload', req.file.buffer, {
      filename: req.file.originalname || 'media_file.bin'
    });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
    });

    const catboxUrl = response.data;
    const filename = catboxUrl.split('/').pop();

    res.json({
      success: true,
      url: `${BASE_URL}/file/${filename}`,
      original_name: req.file.originalname
    });

  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ error: 'Failed to upload to external server' });
  }
});

// 🔄 Proxy Endpoint for Viewing Files
app.get('/file/:filename', async (req, res) => {
  try {
    const catboxUrl = `https://files.catbox.moe/${req.params.filename}`;

    // Fetching the file from Catbox behind the scenes using axios
    const response = await axios({
      method: 'GET',
      url: catboxUrl,
      responseType: 'stream', 
    });

    // Setting the correct content type (e.g., image/png or video/mp4) for the browser
    res.set('Content-Type', response.headers['content-type']);

    // Piping the file directly to the user's screen so the link doesn't change!
    response.data.pipe(res);

  } catch (err) {
    console.error('File Fetch Error:', err.message);
    res.status(404).send('File not found or deleted.');
  }
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Spider Media API is running perfectly!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
