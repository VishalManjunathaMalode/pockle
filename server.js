const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const blockchainFile = 'blockchain.json';
const dataFolder = './data/';
const retrievalLogsFile = 'retrieval_logs.json';

const usersFile = 'users.json';

let currentUser = null; // keep track of logged-in user

// Use environment variable for SECRET_KEY
const SECRET_KEY = process.env.SECRET_KEY || 'your-secure-password'; 
const IV_LENGTH = 16; // AES block size

// Helper functions
function getKey() {
    return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

// Encrypt/decrypt functions
function encrypt(text) {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
    const key = getKey();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// User management
function loadUsers() {
    if (fs.existsSync(usersFile)) {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
    return {};
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Register endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    if (users[username]) {
        return res.status(400).send('User already exists');
    }
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    users[username] = { password: hash };
    saveUsers(users);
    res.send('Registration successful');
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = loadUsers();

    // Check if user exists
    if (!users[username]) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Hash provided password and compare
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (users[username].password !== hash) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Set current user (consider session management in production)
    currentUser = username;

    res.json({ message: `Logged in as ${username}` });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    currentUser = null;
    res.send('Logged out');
});

// Blockchain functions
function getBlockchain() {
    if (fs.existsSync(blockchainFile)) {
        return JSON.parse(fs.readFileSync(blockchainFile, 'utf8'));
    }
    const genesis = [{
        index: 0,
        timestamp: new Date().toISOString(),
        data: 'Genesis Block',
        hash: '0',
        previousHash: '0'
    }];
    fs.writeFileSync(blockchainFile, JSON.stringify(genesis, null, 2));
    return genesis;
}

function saveBlockchain(chain) {
    fs.writeFileSync(blockchainFile, JSON.stringify(chain, null, 2));
}

function addBlock(data, owner, uniqueCode) {
    const chain = getBlockchain();
    const lastBlock = chain[chain.length - 1];
    const index = lastBlock.index + 1;
    const timestamp = new Date().toISOString();
    const hash = crypto.createHash('sha256')
        .update(index + timestamp + data + lastBlock.hash)
        .digest('hex');

    const newBlock = {
        index,
        timestamp,
        data, // filename
        hash,
        previousHash: lastBlock.hash,
        owner,
        uniqueCode
    };
    chain.push(newBlock);
    saveBlockchain(chain);
    return newBlock;
}

// Load and save retrieval logs
function loadRetrievalLogs() {
    if (fs.existsSync(retrievalLogsFile)) {
        return JSON.parse(fs.readFileSync(retrievalLogsFile, 'utf8'));
    }
    return {};
}

function saveRetrievalLogs(logs) {
    fs.writeFileSync(retrievalLogsFile, JSON.stringify(logs, null, 2));
}

// Save uploaded image to history
function appendHistory(filename, imageData, owner) {
    const historyPath = `${dataFolder}${filename}_history.json`;
    let history = [];
    if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    history.push({ timestamp: new Date().toISOString(), imageData, owner });
    fs.writeFileSync(historyPath, JSON.stringify(history));
}

// Get image history
function getHistory(filename) {
    const historyPath = `${dataFolder}${filename}_history.json`;
    if (fs.existsSync(historyPath)) {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    return [];
}

// Upload image endpoint
app.post('/upload', (req, res) => {
    if (!currentUser) return res.status(403).send('Please login first');

    const { imageBase64, uniqueCode } = req.body;
    if (!imageBase64 || !uniqueCode) {
        return res.status(400).send('Image data and unique code required');
    }

    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder);
    }

    const filename = `images_${Date.now()}.txt`;
    const encryptedData = encrypt(imageBase64);
    fs.writeFileSync(`${dataFolder}${filename}`, encryptedData);

    // Save history
    appendHistory(filename, imageBase64, currentUser);

    // Add block with owner and unique code
    const newBlock = addBlock(filename, currentUser, uniqueCode);
    res.json({ message: 'Image uploaded', block: newBlock });
});

// Retrieve image by unique code
app.post('/retrieve', (req, res) => {
    if (!currentUser) return res.status(403).send('Please login first');

    const { uniqueCode } = req.body;
    if (!uniqueCode) return res.status(400).send('Unique code required');

    const chain = getBlockchain();
    const block = chain.find(b => b.uniqueCode === uniqueCode);
    if (!block) return res.status(404).send('Image not found');

    const encryptedData = fs.readFileSync(`${dataFolder}${block.data}`, 'utf8');
    const decryptedData = decrypt(encryptedData);

    // Log retrieval
    const logs = loadRetrievalLogs();
    if (!logs[block.data]) logs[block.data] = [];
    const timestamp = new Date().toISOString();
    logs[block.data].push({ username: currentUser, timestamp });
    saveRetrievalLogs(logs);

    // Append to history
    appendHistory(block.data, decryptedData, currentUser);

    // Update hash based on image + user + timestamp
    const newHash = crypto.createHash('sha256')
        .update(decryptedData + currentUser + timestamp)
        .digest('hex');

    // Update block hash
    block.hash = newHash;
    saveBlockchain(chain);

    res.json({ imageBase64: decryptedData, timestamp });
});

// Get full history of uploaded images
app.get('/history', (req, res) => {
    if (!currentUser) return res.status(403).send('Please login first');

    const chain = getBlockchain();
    const userBlocks = chain.filter(b => b.owner === currentUser);
    const fullHistory = userBlocks.map(b => {
        const history = getHistory(b.data);
        return {
            uniqueCode: b.uniqueCode,
            filename: b.data,
            uploadedAt: b.timestamp,
            history: history
        };
    });
    res.json({ fullHistory });
});

// Serve index.html or other frontend if needed
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});