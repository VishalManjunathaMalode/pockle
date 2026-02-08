from flask import Flask, request, jsonify
import json
import hashlib
import time

app = Flask(__name__)

# Blockchain-like storage
blockchain_file = 'credentials.json'

def load_blockchain():
    try:
        with open(blockchain_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_blockchain(chain):
    with open(blockchain_file, 'w') as f:
        json.dump(chain, f, indent=4)

def create_block(data):
    chain = load_blockchain()
    previous_hash = chain[-1]['hash'] if chain else '0'
    block = {
        'timestamp': time.time(),
        'data': data,
        'previous_hash': previous_hash,
        'hash': hashlib.sha256((str(time.time()) + json.dumps(data)).encode()).hexdigest()
    }
    chain.append(block)
    save_blockchain(chain)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    chain = load_blockchain()

    # Check if username exists
    for block in chain:
        credentials = block['data']
        if credentials['username'] == username:
            return jsonify({'message': 'Username already exists'}), 400

    # Store credentials with hashing
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    credentials = {
        'username': username,
        'password': hashed_password
    }
    create_block(credentials)
    return jsonify({'message': 'Registration successful'})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    chain = load_blockchain()

    for block in chain:
        credentials = block['data']
        if credentials['username'] == username:
            hashed_input_password = hashlib.sha256(password.encode()).hexdigest()
            if credentials['password'] == hashed_input_password:
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Incorrect password'}), 401
    return jsonify({'message': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)