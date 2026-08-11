const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// আপনার ডোমেইন এখানে দাও (পরে Render দেবে)
const BASE_URL = process.env.BASE_URL || 'https://spider-avik.onrender.com';

app.use(cors());
app.use(express.json());

// uploads ফোল্ডার তৈরি
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// স্ট্যাটিক ফাইল সার্ভ
app.use('/file', express.static(uploadDir));

// কাউন্টার ফাইল
const counterFile = path.join(__dirname, 'counter.json');
if (!fs.existsSync(counterFile)) {
  fs.writeJsonSync(counterFile, { count: 1000 });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const data = fs.readJsonSync(counterFile);
    data.count += 1;
    fs.writeJsonSync(counterFile, data);

    const ext = path.extname(file.originalname) || '.bin';
    const filename = `\( {data.count} \){ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// আপলোড এন্ডপয়েন্ট
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `\( {BASE_URL}/file/ \){req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename
  });
});

// হেলথ চেক
app.get('/', (req, res) => {
  res.send('Media Host is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
