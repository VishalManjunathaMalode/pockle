// User data storage
let users = {};
let blockchain = [];

// Load users and blockchain from local storage on page load
window.addEventListener('load', () => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    users = JSON.parse(storedUsers);
  }

  const storedBlockchain = localStorage.getItem('blockchain');
  if (storedBlockchain) {
    blockchain = JSON.parse(storedBlockchain);
  }

  // Create genesis block if blockchain is empty
  if (blockchain.length === 0) {
    createGenesisBlock();
  }
});

// Save users to local storage
function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

// Save blockchain to local storage
function saveBlockchain() {
  localStorage.setItem('blockchain', JSON.stringify(blockchain));
}

// Toggle between register and login views
document.getElementById('showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('registerBox').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('registerBox').style.display = 'none';
  document.getElementById('loginBox').style.display = 'block';
});

// Handle login
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
    messageDiv.textContent = 'Invalid username or password.';
  }
});

// Handle registration
document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const messageDiv = document.getElementById('registerMessage');

  if (username === '' || password === '') {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Please fill in all fields.';
    return;
  }

  if (users[username]) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Username already exists.';
  } else {
    users[username] = password;
    saveUsers();
    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Registration successful! You can now login.';
    setTimeout(() => {
      document.getElementById('showLogin').click();
    }, 1500);
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
    <h3>Image Upload & Retrieval</h3>
    <input type="file" id="imageUpload" accept="image/*" />
    <button id="uploadBtn">Upload Image</button>
    <br/><br/>
    <input type="text" id="retrieveCode" placeholder="Enter code to retrieve image" />
    <button id="retrieveBtn">Retrieve Image</button>
    <div id="retrievedImage" style="margin-top:10px;"></div>
    <h4>Retrieval History</h4>
    <ul id="historyList"></ul>
  `;
  document.getElementById('mainContent').appendChild(container);

  document.getElementById('uploadBtn').addEventListener('click', () => {
    uploadImage(username);
  });
  document.getElementById('retrieveBtn').addEventListener('click', () => {
    retrieveImage();
  });
}

// Create the genesis block if blockchain is empty
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

// Calculate SHA-256 hash
async function calculateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate new block containing image data
async function generateBlock(imageData, username) {
  const previousBlock = blockchain[blockchain.length - 1];
  const newIndex = previousBlock.index + 1;
  const newBlock = {
    index: newIndex,
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

// Upload image and store in blockchain
async function uploadImage(username) {
  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select an image to upload.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const imageData = reader.result;
    const newBlock = await generateBlock(imageData, username);
    alert(`Image stored in blockchain with code: ${newBlock.index}`);
    fileInput.value = '';
  };
  reader.readAsDataURL(file);
}

// Retrieve image by code (block index)
function retrieveImage() {
  const code = document.getElementById('retrieveCode').value.trim();
  const imageContainer = document.getElementById('retrievedImage');

  const block = blockchain.find(b => b.index.toString() === code);
  if (block && block.imageData) {
    imageContainer.innerHTML = `<img src="${block.imageData}" alt="Retrieved Image" width="300" />`;
    addToHistory(block);
  } else {
    imageContainer.innerHTML = 'No image found for this code.';
  }
}

// Add retrieved block info to history
function addToHistory(block) {
  const historyList = document.getElementById('historyList');
  const li = document.createElement('li');
  li.textContent = `Code: ${block.index} | Time: ${block.timestamp}`;
  historyList.appendChild(li);
}