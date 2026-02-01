// User data storage
let users = {};
let blockchain = [];

// Load users and blockchain from local storage on page load
window.addEventListener('load', () => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) users = JSON.parse(storedUsers);
  const storedBlockchain = localStorage.getItem('blockchain');
  if (storedBlockchain) blockchain = JSON.parse(storedBlockchain);
  if (blockchain.length === 0) createGenesisBlock();
});

// Save functions
function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}
function saveBlockchain() {
  localStorage.setItem('blockchain', JSON.stringify(blockchain));
}

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

// Start image functions after login
function startImageFunctions(username) {
  document.getElementById('mainContent').innerHTML = '';
  createImageSection(username);
}

// Create upload and retrieve UI
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
    <h4>History</h4>
    <ul id="historyList"></ul>
  `;
  document.getElementById('mainContent').appendChild(container);

  document.getElementById('uploadBtn').addEventListener('click', () => uploadImage(username));
  document.getElementById('retrieveBtn').addEventListener('click', retrieveImage);
}

// Create genesis block if blockchain is empty
async function createGenesisBlock() {
  const genesisBlock = {
    index: 0,
    timestamp: new Date().toISOString(),
    imageData: '',
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

// Add new block
async function generateBlock(imageData, username) {
  const previousBlock = blockchain[blockchain.length - 1];
  const newBlock = {
    index: previousBlock.index + 1,
    timestamp: new Date().toISOString(),
    imageData: imageData,
    previousHash: previousBlock.hash,
    hash: ''
  };
  newBlock.hash = await calculateHash(JSON.stringify(newBlock));
  blockchain.push(newBlock);
  saveBlockchain();
  return newBlock;
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
    imageDiv.innerHTML = `<img src="${block.imageData}" width="300" />`;
    addToHistory(block);
  } else {
    imageDiv.innerHTML = 'No image found.';
  }
}

// Add to history
function addToHistory(block) {
  const list = document.getElementById('historyList');
  const li = document.createElement('li');
  li.textContent = `Code: ${block.index} | Time: ${block.timestamp}`;
  list.appendChild(li);
}