// Simple in-memory user data storage (for demonstration)
let users = {}; // Key: username, Value: password

// Show register form
document.getElementById('showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('registerBox').style.display = 'block';
});

// Show login form
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
    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Registration successful! You can now login.';
    // Optionally, switch to login form
    setTimeout(() => {
      document.getElementById('showLogin').click();
    }, 1500);
  }
});