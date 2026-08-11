require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || 'https://spider-avik.onrender.com';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number
});
const Counter = mongoose.model('Counter', counterSchema);

const fileSchema = new mongoose.Schema({
  filename: String,
  cloudinaryUrl: String
});
const File = mongoose.model('File', fileSchema);

// Function to generate sequential IDs (starts from 1000)
async function getNextSequence() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'fileId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  if (counter.seq < 1000) {
    counter.seq = 1000;
    await counter.save();
  }
  return counter.seq;
}

// Memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Error:', error);
          return res.status(500).json({ error: 'Cloudinary upload failed' });
        }

        // Generate custom filename using MongoDB counter
        const fileId = await getNextSequence();
        const ext = path.extname(req.file.originalname) || '.bin';
        const customFilename = `${fileId}${ext}`;

        // Save file info to MongoDB
        const newFile = new File({
          filename: customFilename,
          cloudinaryUrl: result.secure_url
        });
        await newFile.save();

        res.json({
          success: true,
          url: `${BASE_URL}/file/${customFilename}`,
          filename: customFilename
        });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Redirect Endpoint
app.get('/file/:filename', async (req, res) => {
  try {
    const fileData = await File.findOne({ filename: req.params.filename });
    if (fileData) {
      res.redirect(fileData.cloudinaryUrl);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Media Host with MongoDB & Cloudinary is running on Render!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
