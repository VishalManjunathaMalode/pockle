// User data storage
let users = {}; // username: password

// Blockchain-like ledger
let blockchain = []; // Array of blocks (transactions)
let retrievedHistory = {}; // user: [{code, imageData, timestamp}]

// Show register/login toggles
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
    messageDiv.textContent = 'Invalid username or password.';
  }
});

// Register
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
    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Registration successful! You can now login.';
    setTimeout(() => {
      document.getElementById('showLogin').click();
    }, 1500);
  }
});

// Start image functions after login
function startImageFunctions(username) {
  // Show the main image upload/retrieve section
  // (Create or reveal a section in your HTML, for demo we'll assume it's there)
  if (!document.getElementById('imageSection')) {
    createImageSection(username);
  }
}

// Create image upload/retrieve UI
function createImageSection(username) {
  const container = document.createElement('div');
  container.id = 'imageSection';
  container.innerHTML = `
    <h3>Image Upload & Retrieval</h3>
    <input type="file" id="imageUpload" accept="image/*" />
    <button id="uploadBtn">Upload Image</button>
    <br><br>
    <input type="text" id="retrieveCode" placeholder="Enter code to retrieve image" />
    <button id="retrieveBtn">Retrieve Image</button>
    <div id="retrievedImage"></div>
    <h4>Retrieval History</h4>
    <ul id="historyList"></ul>
  `;
  document.body.appendChild(container);

  document.getElementById('uploadBtn').addEventListener('click', () => {
    uploadImage(username);
  });
  document.getElementById('retrieveBtn').addEventListener('click', () => {
    retrieveImage();
  });
}

// Function to upload image with a unique code
function uploadImage(username) {
  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select an image to upload.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const imageData = reader.result; // base64 string
    const code = generateUniqueCode();

    // Create a block (transaction)
    const block = {
      code: code,
      username: username,
      imageData: imageData,
      timestamp: new Date().toISOString()
    };
    blockchain.push(block);

    alert(`Image uploaded with code: ${code}`);
    fileInput.value = ''; // reset input
  };
  reader.readAsDataURL(file);
}

// Generate a simple unique code (for demo purposes)
function generateUniqueCode() {
  return 'IMG' + Date.now() + Math.floor(Math.random() * 1000);
}

// Function to retrieve image by code
function retrieveImage() {
  const code = document.getElementById('retrieveCode').value.trim();
  const imageContainer = document.getElementById('retrievedImage');
  const historyList = document.getElementById('historyList');

  // Find the block with this code
  const block = blockchain.find(b => b.code === code);
  if (block) {
    // Show image
    imageContainer.innerHTML = `<img src="${block.imageData}" alt="Retrieved Image" width="300" />`;
    // Log in history
    addToHistory(block);
  } else {
    imageContainer.innerHTML = 'No image found for this code.';
  }
}

// Add to retrieval history
function addToHistory(block) {
  const historyList = document.getElementById('historyList');
  const li = document.createElement('li');
  li.textContent = `Code: ${block.code} | User: ${block.username} | Time: ${block.timestamp}`;
  historyList.appendChild(li);
}