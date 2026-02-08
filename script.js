// Data storage
let blockchain = [];
let currentUser = '';

// Load data
window.addEventListener('load', () => {
  const storedBlockchain = localStorage.getItem('blockchain');
  if (storedBlockchain) {
    blockchain = JSON.parse(storedBlockchain);
  } else {
    createGenesisBlock();
  }
});

// Save blockchain
function saveBlockchain() {
  localStorage.setItem('blockchain', JSON.stringify(blockchain));
}

// Create Genesis Block if none exists
async function createGenesisBlock() {
  const genesisBlock = {
    index: 0,
    timestamp: new Date().toISOString(),
    data: 'Genesis Block',
    previousHash: '0',
    hash: ''
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

// Add a block
async function addBlock(data) {
  const previousBlock = blockchain[blockchain.length - 1];
  const newBlock = {
    index: previousBlock.index + 1,
    timestamp: new Date().toISOString(),
    data: data,
    previousHash: previousBlock.hash,
    hash: ''
  };
  newBlock.hash = await calculateHash(JSON.stringify(newBlock));
  blockchain.push(newBlock);
  saveBlockchain();
  return newBlock;
}

// Registration
document.getElementById('registerBtn').addEventListener('click', async () => {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const messageDiv = document.getElementById('registerMessage');

  if (username === '' || password === '') {
    messageDiv.textContent = 'Fill all fields.';
    messageDiv.style.color = 'red';
    return;
  }

  // Check if user exists
  const userExists = blockchain.some(block => {
    if (block.data.type === 'user' && block.data.username === username) {
      return true;
    }
    return false;
  });

  if (userExists) {
    messageDiv.textContent = 'Username already registered.';
    messageDiv.style.color = 'red';
    return;
  }

  // Store user credentials in blockchain
  const userData = { type: 'user', username: username, password: password };
  await addBlock(userData);
  messageDiv.textContent = 'Registration successful!';
  messageDiv.style.color = 'green';

  // Switch to login
  setTimeout(() => {
    document.getElementById('showLogin').click();
  }, 1000);
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const messageDiv = document.getElementById('loginMessage');

  // Search for user in blockchain
  const userBlock = [...blockchain].reverse().find(b => b.data.type === 'user' && b.data.username === username);
  if (userBlock && userBlock.data.password === password) {
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

// Create upload/retrieve UI
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
    // Store image data along with username
    const data = {
      type: 'image',
      username: username,
      imageData: imageData
    };
    const newBlock = await addBlock(data);
    alert(`Image stored with code: ${newBlock.index}`);
    document.getElementById('imageUpload').value = '';
  };
  reader.readAsDataURL(file);
}

// Retrieve image
function retrieveImage() {
  const code = document.getElementById('retrieveCode').value.trim();
  const imageDiv = document.getElementById('retrievedImage');

  const block = blockchain.find(b => b.index.toString() === code && b.data.type === 'image');
  if (block && block.data.imageData) {
    // Log retrieval with timestamp
    // Store retrieval info in the block
    if (!block.data.retrievedBy) {
      block.data.retrievedBy = [];
    }
    if (!block.data.retrievedBy.some(entry => entry.user === currentUser)) {
      block.data.retrievedBy.push({ user: currentUser, timestamp: new Date().toISOString() });
    }
    // Show image
    imageDiv.innerHTML = `<img src="${block.data.imageData}" width="300" />`;
    showImageHistory(block);
  } else {
    imageDiv.innerHTML = 'No image found.';
    document.getElementById('imageHistory').innerHTML = '';
  }
}

// Show detailed retrieval history with timestamps
function showImageHistory(block) {
  const container = document.getElementById('imageHistory');
  container.innerHTML = '';

  // Show uploader info
  const uploaderDiv = document.createElement('div');
  uploaderDiv.innerHTML = `
    <b>Uploaded by:</b> ${block.data.username} <br/>
    <b>Upload time:</b> ${new Date(block.timestamp).toLocaleString()}
  `;
  container.appendChild(uploaderDiv);

  // Show retrieval history
  if (block.data.retrievedBy && block.data.retrievedBy.length > 0) {
    const historyDiv = document.createElement('div');
    historyDiv.innerHTML = '<b>Retrieval history:</b><br/>';
    block.data.retrievedBy.forEach(entry => {
      historyDiv.innerHTML += `- ${entry.user} at ${new Date(entry.timestamp).toLocaleString()}<br/>`;
    });
    container.appendChild(historyDiv);
  } else {
    const noViews = document.createElement('div');
    noViews.innerHTML = 'No views yet.';
    container.appendChild(noViews);
  }

  // Show current viewer
  const currentViewerDiv = document.createElement('div');
  currentViewerDiv.innerHTML = `<b>Current viewer:</b> ${currentUser}`;
  container.appendChild(currentViewerDiv);
}