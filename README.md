# Vlarker (Vlown AR Demonstration App)

Vlarker is a hybrid Web2/Web3 progressive web application that demonstrates the power of the **Vlown Land Ownership Standard**.

It allows users to physically walk around the real world with their mobile devices and see location-based messages ("blurbs") left by the virtual landowners of those exact GPS coordinates.

## Architecture

Vlarker intentionally uses a **hybrid architecture** to demonstrate how traditional Web2 developers can easily integrate with Web3 ownership standards:

1. **Web3 (Polygon Mainnet):** The Vlown ERC721 smart contract is the absolute source of truth for location ownership. Vlarker queries the blockchain to identify who owns a specific GPS coordinate plot.
2. **Web2 (Firebase Firestore):** Because writing data to a blockchain is slow and costs gas, the actual text "blurbs" that owners write are stored in a standard Firebase NoSQL database. 

Vlarker ties these together. When an owner wants to update their plot's message, Vlarker first cryptographically verifies they own the plot on-chain using `Ethers.js`, and *then* writes the message to Firebase. When a visitor views the plot, Vlarker instantly syncs the message from Firebase for a fast, free AR experience!

## Getting Started

To run your own version of Vlarker or build upon this template, you will need a synced Firebase instance to store your messages.

### 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new Web Project.
2. Enable **Firestore Database** in Test Mode.
3. Once created, go to Project Settings -> General -> "Your apps" to view your SDK configuration keys.

### 2. Environment Variables
1. Clone this repository and navigate to the `vlarker` directory.
2. Copy the `.env.example` file and rename it to `.env`.
3. Fill in the `.env` file with the keys you generated from your Firebase console.

```env
VITE_FIREBASE_API_KEY="AIzaSyD..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
...
```

### 3. Running Locally
Run the Vite development server:
```bash
npm install
npm run dev
```

The app will launch on `http://localhost:3000`.

## Production & Security

> **Note:** The current Firestore database is configured in "Test Mode". Before launching a production application derived from Vlarker, you must write Firebase Security Rules that require a cryptographically signed payload from the user's connected wallet matching the owner address of the Vlown token being modified.
