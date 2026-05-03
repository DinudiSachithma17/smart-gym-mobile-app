const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensureDir('uploads/profiles');
ensureDir('uploads/complaints');
ensureDir('uploads/feedback');
ensureDir('uploads/packages');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const routePath = req.baseUrl || '';
    if (routePath.includes('complaint')) cb(null, 'uploads/complaints');
    else if (routePath.includes('feedback')) cb(null, 'uploads/feedback');
    else if (routePath.includes('package')) cb(null, 'uploads/packages');
    else cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf'
    || file.mimetype.includes('word') || file.mimetype === 'text/plain';
  if (ext || mime) cb(null, true);
  else cb(new Error('Only images, PDFs, and documents are allowed'));
};

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

// For complaints: allow images + documents
exports.uploadFile = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('file');

// For profiles, feedback, packages: images only
exports.uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('image');
