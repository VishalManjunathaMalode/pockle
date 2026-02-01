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

// Generate unique code
function generateUniqueCode() {
  return 'IMG' + Date.now() + Math.floor(Math.random() * 1000);
}

// Upload image and add to blockchain
function uploadImage(username) {
  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select an image to upload.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const imageData = reader.result;
    const code = generateUniqueCode();

    const block = {
      code: code,
      username: username,
      imageData: imageData,
      timestamp: new Date().toISOString()
    };
    blockchain.push(block);
    saveBlockchain();
    alert(`Image uploaded with code: ${code}`);
    fileInput.value = '';
  };
  reader.readAsDataURL(file);
}

// Retrieve image by code
function retrieveImage() {
  const code = document.getElementById('retrieveCode').value.trim();
  const imageContainer = document.getElementById('retrievedImage');

  const block = blockchain.find(b => b.code === code);
  if (block) {
    imageContainer.innerHTML = `<img src="${block.imageData}" alt="Retrieved Image" width="300" />`;
    addToHistory(block);
  } else {
    imageContainer.innerHTML = 'No image found for this code.';
  }
}

// Add retrieved info to history (for all users)
function addToHistory(block) {
  const historyList = document.getElementById('historyList');
  const li = document.createElement('li');
  li.textContent = `Code: ${block.code} | User: ${block.username} | Time: ${block.timestamp}`;
  historyList.appendChild(li);
}