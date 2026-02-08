// Load blockchain data from JSON file
let blockchainData = null;

fetch('blockchain.json')
  .then(response => response.json())
  .then(data => {
    blockchainData = data;
    displayBlockchain();
  })
  .catch(error => {
    console.error('Error loading blockchain data:', error);
  });

// Simple hash function (for demonstration only)
function simpleHash(str) {
  let hash = 0, i, chr;
  for(i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

function displayBlockchain() {
  document.getElementById('blockchainDisplay').textContent = JSON.stringify(blockchainData, null, 2);
}

document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // Hash the password
  const passwordHash = simpleHash(password);
  
  // Get previous block
  const prevBlock = blockchainData.blockchain[blockchainData.blockchain.length - 1];
  
  // Create new block
  const newIndex = prevBlock.index + 1;
  const timestamp = new Date().toISOString();
  const blockContent = newIndex + timestamp + username + passwordHash + prevBlock.hash;
  const blockHash = simpleHash(blockContent);
  
  const newBlock = {
    index: newIndex,
    timestamp: timestamp,
    username: username,
    password_hash: passwordHash,
    prev_hash: prevBlock.hash,
    hash: blockHash
  };
  
  // Append new block to blockchain
  blockchainData.blockchain.push(newBlock);
  
  // Display updated blockchain
  displayBlockchain();
  
  // Clear form
  document.getElementById('registerForm').reset();
});