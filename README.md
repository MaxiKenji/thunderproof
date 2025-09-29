# Thunderproof v3 - Decentralized Review System

**Authentic Bitcoin ecosystem reviews powered by Nostr protocol**

## 🚀 Features

- **Real Nostr Integration**: Reviews stored permanently on decentralized Nostr relays
- **Private Key Login**: Secure nsec authentication (no key generation)  
- **Cryptographic Signatures**: Every review is cryptographically signed and verifiable
- **SVG Asset Support**: Clean shield rating system with SVG graphics
- **Embeddable Widgets**: Share reviews anywhere with iframe components
- **No Fake Reviews**: Only real, authenticated reviews from Nostr

## 📁 Repository Structure

```
thunderproof-v3/
├── index.html          # Main website (Hero + Profile sections)
├── style.css           # Complete dark theme styling  
├── script.js           # Full Nostr review system
├── embed.html          # Embeddable widget for other sites
├── assets/             # SVG shield rating assets (0.svg to 100.svg)
├── README.md           # This file
└── .gitignore          # Git ignore file
```

## 🎯 How It Works

### 1. **Search Profiles**
- Enter any Nostr public key (npub) to find profiles
- Fetches real profile data from Nostr relays
- Shows authentic reviews only (no fake data)

### 2. **Connect with Nostr**
- **Extension**: Connect with Alby, nos2x, or other NIP-07 extensions
- **Private Key**: Enter your nsec manually (stored locally for convenience)
- Removed key generation for security best practices

### 3. **Add Reviews**
- 5-shield rating system using your SVG assets
- Write detailed comments up to 500 characters
- Reviews published as NIP-32 labeling events (kind 1985)
- Cryptographically signed and stored permanently

### 4. **Share Reviews**
- Direct profile links with URL parameters
- Embeddable iframe widgets for websites
- Customizable widget dimensions and review limits

## 🔧 Technical Implementation

### **Nostr Protocol**
- **Event Kind**: 1985 (NIP-32 labeling)
- **Namespace**: `thunderproof`
- **Tags**:
  - `L`: Label namespace
  - `l`: Label type (`review`)  
  - `p`: Target pubkey being reviewed
  - `rating`: 1-5 shield rating
  - `client`: Thunderproof

### **Relays Used**
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.snort.social` 
- `wss://relay.current.fyi`
- `wss://brb.io`
- `wss://offchain.pub`
- `wss://relay.nostr.band`

### **Asset Requirements**
You need to provide these SVG files in the `assets/` folder:
- `logo.svg` - Thunderproof logo
- `0.svg` to `100.svg` - shield ratings (0%, 10%, 20%, ..., 100%)

## 🌟 Key Improvements v3

1. **✅ Real Persistence**: Reviews stay on Nostr relays forever
2. **✅ No Fake Data**: Removed all demo/placeholder reviews  
3. **✅ Working nsec Login**: Manual private key entry with local storage
4. **✅ Removed Key Generation**: Security best practice
5. **✅ Enhanced Error Handling**: Better loading states and error messages
6. **✅ SVG Support**: Uses your shield rating assets properly
7. **✅ Mobile Responsive**: Works great on all device sizes
8. **✅ Professional UI**: Dark theme with Bitcoin orange accents

## 📦 Setup Instructions

### **1. Create New Repository**
```bash
git clone https://github.com/MaxiKenji/thunderproof-v3.git
cd thunderproof-v3
```

### **2. Add Your Assets**
Create `assets/` folder and add your SVG files:
- Convert your JPG shield ratings to SVG format
- Name them: `0.svg`, `10.svg`, `20.svg`, ..., `100.svg`
- Add your `logo.svg` file

### **3. Deploy to GitHub Pages**
```bash
git add .
git commit -m "Initial Thunderproof v3 setup"
git push origin main

# Enable GitHub Pages in Settings → Pages → main branch
```

### **4. Test Functionality**
1. Visit your GitHub Pages URL
2. Search for a profile using example npubs
3. Connect with your Nostr account
4. Add a test review and verify it persists
5. Test the embed widget

## 🔗 Example Usage

### **Direct Profile Links**
```
https://yoursite.com/?profile=npub104fpzfgtc4h272p66uye2nhjes622x7dduk97g8re5h8gmmv2pnsqdq2a2
```

### **Embed Widget**

Coming soon!

## 💡 Review Data Format

Reviews are stored as Nostr events with this structure:
```json
{
  "kind": 1985,
  "content": "Review comment text",
  "tags": [
    ["L", "thunderproof"],
    ["l", "review", "thunderproof"],
    ["p", "target_pubkey_hex"],
    ["rating", "5"],
    ["client", "Thunderproof"]
  ],
  "created_at": 1234567890,
  "pubkey": "reviewer_pubkey_hex",
  "id": "event_id",
  "sig": "signature"
}
```

## 🛡️ Security Features

- **No Key Generation**: Users must provide their own keys
- **Local Storage Only**: Private keys never sent to servers
- **Cryptographic Verification**: All reviews signature-verified
- **Extension Support**: Secure NIP-07 wallet integration
- **Decentralized Storage**: No central point of failure



---

**Built with ⚡ for the Bitcoin ecosystem on Nostr protocol**

*No fake reviews. No manipulation. Just proof of trust.*
