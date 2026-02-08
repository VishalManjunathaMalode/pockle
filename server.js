// server.js
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // To handle large image data

const dataFile = 'data.json';

// Load existing data or initialize
let data = { users: [], images: [] };
if (fs.existsSync(dataFile)) {
  data = JSON.parse(fs.readFileSync(dataFile));
}

// Save data function
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Register user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User exists' });
  }
  data.users.push({ username, password });
  saveData();
  res.json({ message: 'Registered' });
});

// Login validation (optional, for client-side check)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Upload image
app.post('/upload', (req, res) => {
  const { username, imageData } = req.body;
  const id = data.images.length + 1;
  data.images.push({
    id,
    username,
    imageData,
    timestamp: new Date().toISOString(),
    retrievedBy: []
  });
  saveData();
  res.json({ message: 'Image stored', code: id });
});

// Retrieve image
app.post('/retrieve', (req, res) => {
  const { code, username } = req.body;
  const image = data.images.find(img => img.id === parseInt(code));
  if (image) {
    // Log retrieval
    image.retrievedBy.push({ user: username, timestamp: new Date().toISOString() });
    saveData();
    res.json({ imageData: image.imageData });
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});