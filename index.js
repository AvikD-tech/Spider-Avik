const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || 'https://spider-avik.onrender.com'; 

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// আপলোড এন্ডপয়েন্ট
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    // বাফারের সাথে ফাইলের নাম পাঠানো জরুরি
    form.append('fileToUpload', req.file.buffer, {
      filename: req.file.originalname || 'media_file.bin'
    });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
    });

    const catboxUrl = response.data; // উদা: https://files.catbox.moe/xyz123.jpg
    const filename = catboxUrl.split('/').pop(); // আউটপুট: xyz123.jpg

    res.json({
      success: true,
      url: `${BASE_URL}/file/${filename}`, // কাস্টম ডোমেইনের লিংক
      original_name: req.file.originalname
    });

  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ error: 'Failed to upload to external server' });
  }
});

// রিডাইরেক্ট এন্ডপয়েন্ট (ফাইল দেখার জন্য)
app.get('/file/:filename', (req, res) => {
  res.redirect(`https://files.catbox.moe/${req.params.filename}`);
});

// হেলথ চেক
app.get('/', (req, res) => {
  res.send('King Avik Media API is running perfectly!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
