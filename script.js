// Data storage
let users = {};
let blockchain = [];
let currentUser = '';

// Load data
window.addEventListener('load', () => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) users = JSON.parse(storedUsers);
  const storedBlockchain = localStorage.getItem('blockchain');
  if (storedBlockchain) blockchain = JSON.parse(storedBlockchain);
  if (blockchain.length === 0) createGenesisBlock();
});

// Save functions
function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
function saveBlockchain() { localStorage.setItem('blockchain', JSON.stringify(blockchain)); }

// Toggle views
document.getElementById('showRegister').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('registerBox').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('registerBox').style.display = 'none';
  document.getElementById('loginBox').style.display = 'block';
});

// Register
document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const messageDiv = document.getElementById('registerMessage');
  if (username === '' || password === '') {
    messageDiv.textContent = 'Fill all fields.';
    messageDiv.style.color = 'red';
    return;
  }
  if (users[username]) {
    messageDiv.textContent = 'Username exists.';
    messageDiv.style.color = 'red';
  } else {
    users[username] = password;
    saveUsers();
    messageDiv.textContent = 'Registered! You can login.';
    messageDiv.style.color = 'green';
    setTimeout(() => {
      document.getElementById('showLogin').click();
    }, 1500);
  }
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const messageDiv = document.getElementById('loginMessage');
  if (users[username] && users[username] === password) {
    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Login successful!';
    startImageFunctions(username);
  } else {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Invalid credentials.';
  }
});

// Start image functions
function startImageFunctions(username) {
  currentUser = username;
  document.getElementById('mainContent').innerHTML = '';
  createImageSection(username);
}

// Genesis block
async function createGenesisBlock() {
  const genesisBlock = {
    index: 0,
    timestamp: new Date().toISOString(),
    imageData: '',
    previousHash: '0',
    hash: '',
    storedBy: 'System',
    retrievedBy: []
  };
  genesisBlock.hash = await calculateHash(JSON.stringify(genesisBlock));
  blockchain.push(genesisBlock);
  saveBlockchain();
}

// Hash function
async function calculateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Add new block
async function generateBlock(imageData, username) {
  const previousBlock = blockchain[blockchain.length - 1];
  const newBlock = {
    index: previousBlock.index + 1,
    timestamp: new Date().toISOString(),
    imageData: imageData,
    previousHash: previousBlock.hash,
    hash: '',
    storedBy: username,
    retrievedBy: []
  };
  newBlock.hash = await calculateHash(JSON.stringify(newBlock));
  blockchain.push(newBlock);
  saveBlockchain();
  // No action log here
  return newBlock;
}

// Create upload & retrieve UI
function createImageSection(username) {
  const container = document.createElement('div');
  container.id = 'imageSection';
  container.innerHTML = `
    <h3>Upload & Retrieve Images</h3>
    <input type="file" id="imageUpload" accept="image/*" />
    <button id="uploadBtn">Upload Image</button>
    <br/><br/>
    <input type="text" id="retrieveCode" placeholder="Enter code to retrieve" />
    <button id="retrieveBtn">Retrieve Image</button>
    <div id="retrievedImage" style="margin-top:10px;"></div>
    <h4>Action Log for Selected Image</h4>
    <div id="imageHistory"></div>
  `;
  document.getElementById('mainContent').appendChild(container);
  document.getElementById('uploadBtn').addEventListener('click', () => uploadImage(username));
  document.getElementById('retrieveBtn').addEventListener('click', () => retrieveImage());
}

// Log an action
function logAction(type, code, user) {
  // Action logging for full history is optional and not implemented here
}

// Upload image
async function uploadImage(username) {
  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('Select an image.');
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const imageData = reader.result;
    const newBlock = await generateBlock(imageData, username);
    alert(`Stored with code: ${newBlock.index}`);
    document.getElementById('imageUpload').value = '';
  };
  reader.readAsDataURL(file);
}

// Retrieve image
function retrieveImage() {
  const code = document.getElementById('retrieveCode').value.trim();
  const imageDiv = document.getElementById('retrievedImage');
  const block = blockchain.find(b => b.index.toString() === code);
  if (block && block.imageData) {
    // Log retrieval
    if (!block.retrievedBy.some(entry => entry.user === currentUser)) {
      block.retrievedBy.push({ user: currentUser, timestamp: new Date().toISOString() });
      saveBlockchain();
    }
    // Log action
    logAction('Retrieve', block.index, currentUser);
    // Show image
    imageDiv.innerHTML = `<img src="${block.imageData}" width="300" />`;
    // Show detailed retrieval history
    showImageHistory(block);
  } else {
    imageDiv.innerHTML = 'No image found.';
    document.getElementById('imageHistory').innerHTML = '';
  }
}

// Show detailed retrieval & upload history as a table with upload info outside
function showImageHistory(block) {
  const container = document.getElementById('imageHistory');
  container.innerHTML = '';

  // Show upload info outside the table
  const uploadInfoDiv = document.createElement('div');
  uploadInfoDiv.innerHTML = `<b>Uploaded by:</b> ${block.storedBy} <br/>
                             <b>Upload time:</b> ${isNaN(new Date(block.timestamp).getTime()) ? 'Invalid Date' : new Date(block.timestamp).toLocaleString()}`;
  container.appendChild(uploadInfoDiv);

  // Create table for retrievals
  const table = document.createElement('table');
  table.border = '1';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  // Table header
  const headerRow = document.createElement('tr');
  const headers = ['Action', 'User', 'Time'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.innerText = headerText;
    th.style.padding = '8px';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Retrieval entries
  block.retrievedBy.forEach(entry => {
    const row = document.createElement('tr');

    const actionTd = document.createElement('td');
    actionTd.innerText = 'Retrieve';

    const userTd = document.createElement('td');
    userTd.innerText = entry.user;

    const dateTd = document.createElement('td');
    const date = new Date(entry.timestamp);
    dateTd.innerText = isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();

    row.appendChild(actionTd);
    row.appendChild(userTd);
    row.appendChild(dateTd);
    table.appendChild(row);
  });

  container.appendChild(table);

  // Show current viewer
  const currentViewerDiv = document.createElement('div');
  currentViewerDiv.innerHTML = `<b>Current viewer:</b> ${currentUser}`;
  container.appendChild(currentViewerDiv);
}