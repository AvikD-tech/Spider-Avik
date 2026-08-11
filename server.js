const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Get BASE_URL from Environment Variable
const BASE_URL = process.env.BASE_URL || 'https://spider-avik.onrender.com';

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// Serve static files from the uploads directory
app.use('/file', express.static(uploadDir));

// Initialize counter file for sequential file naming
const counterFile = path.join(__dirname, 'counter.json');
if (!fs.existsSync(counterFile)) {
  fs.writeJsonSync(counterFile, { count: 1000 });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Read and update the counter
    const data = fs.readJsonSync(counterFile);
    data.count += 1;
    fs.writeJsonSync(counterFile, data);

    // Determine the file extension and generate the new filename
    const ext = path.extname(file.originalname) || '.bin';
    const filename = `${data.count}${ext}`;
    
    cb(null, filename);
  }
});

const upload = multer({ storage });

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Generate the public URL for the uploaded file
  const fileUrl = `${BASE_URL}/file/${req.file.filename}`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Media Host is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
});
