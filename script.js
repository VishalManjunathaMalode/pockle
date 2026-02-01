// Data storage
let users = {};
let blockchain = [];
let currentUser = '';
let actionHistory = []; // To store all actions

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
  createHistorySection();
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
  // Log upload action
  logAction('Upload', newBlock.index, username);
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

// Create full history display
function createHistorySection() {
  const container = document.createElement('div');
  container.id = 'fullHistory';
  container.innerHTML = `<h3>Full Action History</h3><div id="fullHistoryLog"></div>`;
  document.getElementById('mainContent').appendChild(container);
  updateFullHistory();
}

// Log an action
function logAction(type, code, user) {
  const action = {
    type: type,
    code: code,
    user: user,
    timestamp: new Date().toISOString()
  };
  actionHistory.push(action);
  updateFullHistory();
}

// Update full history display
function updateFullHistory() {
  const container = document.getElementById('fullHistoryLog');
  if (!container) return;
  container.innerHTML = '';
  actionHistory.forEach(act => {
    const div = document.createElement('div');
    div.innerHTML = `
      <b>${act.type}</b> - Code: ${act.code} | User: ${act.user} | Time: ${act.timestamp}
    `;
    container.appendChild(div);
  });
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
    if (!block.retrievedBy.includes(currentUser)) {
      block.retrievedBy.push(currentUser);
      saveBlockchain();
    }
    // Log action
    logAction('Retrieve', block.index, currentUser);
    // Show image
    imageDiv.innerHTML = `<img src="${block.imageData}" width="300" />`;
    // Show detailed history for this image
    showImageHistory(block);
  } else {
    imageDiv.innerHTML = 'No image found.';
    document.getElementById('imageHistory').innerHTML = '';
  }
}

// Show detailed history for a specific image
function showImageHistory(block) {
  const container = document.getElementById('imageHistory');
  container.innerHTML = '';
  // Upload info
  const uploadDiv = document.createElement('div');
  uploadDiv.innerHTML = `
    <b>Uploaded by:</b> ${block.storedBy} <br/>
    <b>Upload time:</b> ${block.timestamp}
  `;
  container.appendChild(uploadDiv);
  // Retrieval info
  if (block.retrievedBy.length > 0) {
    const retrievedDiv = document.createElement('div');
    retrievedDiv.innerHTML = '<b>Retrieved by:</b><br/>';
    block.retrievedBy.forEach(user => {
      retrievedDiv.innerHTML += `- ${user}<br/>`;
    });
    container.appendChild(retrievedDiv);
  } else {
    const noRetrieveDiv = document.createElement('div');
    noRetrieveDiv.innerHTML = '<b>No retrievals yet.</b>';
    container.appendChild(noRetrieveDiv);
  }
}