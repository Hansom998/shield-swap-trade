# Shield Swap Trade

A privacy-preserving decentralized exchange built with Fully Homomorphic Encryption (FHE) on Ethereum. Trade behind the shield - your order details remain encrypted until matching completes, preventing MEV attacks and copy trading.

## Demo

[Watch Demo Video](./demo.mp4)

## Live Demo

Try it now: [https://shield-swap-trade.vercel.app/](https://shield-swap-trade.vercel.app/)

## Features

- **Encrypted Orders**: All swap orders are encrypted using FHEVM, keeping your trading strategy private
- **MEV Protection**: Order details are hidden from validators and other traders until execution
- **Wallet Integration**: RainbowKit-powered wallet connection with network switching (Hardhat/Sepolia)
- **Modern UI**: Glassmorphism design with responsive layout

## Tech Stack

### Smart Contracts
- **Solidity** with FHEVM (Fully Homomorphic Encryption Virtual Machine)
- **Hardhat** for development, testing, and deployment
- **FHE Types**: `euint32`, `externalEuint32` for encrypted data storage

### Frontend
- **Next.js 15** with App Router and Turbopack
- **RainbowKit** + **wagmi** for wallet connection
- **Tailwind CSS** + **DaisyUI** for styling
- **FHEVM SDK** for client-side encryption/decryption

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Package manager (recommended)

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/your-repo/shield-swap-trade.git
   cd shield-swap-trade
   pnpm install
   ```

2. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   SEPOLIA_PRIVATE_KEY=your_sepolia_private_key
   LOCAL_PRIVATE_KEY=your_local_private_key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
   INFURA_API_KEY=your_infura_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

3. **Compile contracts**

   ```bash
   pnpm compile
   ```

4. **Run tests**

   ```bash
   pnpm test
   ```

5. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node

   # In another terminal, deploy contracts
   npx hardhat deploy --network localhost
   ```

6. **Start the frontend**

   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Project Structure

```
shield-swap-trade/
├── contracts/
│   └── ShieldSwap.sol       # FHE-encrypted swap order contract
├── deploy/
│   └── deploy.ts            # Deployment script
├── tasks/
│   └── ShieldSwap.ts        # CLI tasks for contract interaction
├── test/
│   ├── ShieldSwap.ts        # Local network tests
│   └── ShieldSwapSepolia.ts # Sepolia testnet tests
├── frontend/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   ├── SwapCard.tsx     # Main trading interface
│   │   ├── StatsPanel.tsx   # Trading statistics
│   │   └── OrdersPanel.tsx  # User's encrypted orders
│   ├── hooks/               # Custom React hooks
│   │   └── useShieldSwap.tsx # Contract interaction hook
│   └── fhevm/               # FHEVM client utilities
├── hardhat.config.ts        # Hardhat configuration
└── package.json             # Dependencies and scripts
```

## Smart Contract API

### ShieldSwap.sol

| Function | Description |
| --- | --- |
| `setOrder(fromAmount, toAmount, inputProof)` | Submit an encrypted swap order |
| `getMyOrder()` | Get your encrypted order handles |
| `getMyOrderTimestamp()` | Get your order creation timestamp |

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm compile` | Compile all contracts |
| `pnpm test` | Run local network tests |
| `pnpm test:sepolia` | Run Sepolia testnet tests |
| `pnpm clean` | Clean build artifacts |

### Frontend Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start development server (binds to 0.0.0.0) |
| `pnpm build` | Build for production |
| `pnpm test` | Run frontend tests |

## How It Works

1. **Connect Wallet**: User connects their MetaMask wallet via RainbowKit
2. **Enter Order**: User specifies swap amounts (e.g., 100 ETH -> 250000 USDC)
3. **Encrypt & Submit**: Order details are encrypted client-side using FHEVM SDK, then submitted on-chain
4. **Stored Encrypted**: Contract stores encrypted values as `euint32` - unreadable to anyone including validators
5. **Decrypt (Owner Only)**: Only the order owner can decrypt their order details using their wallet signature

## Security

- Order amounts are encrypted using FHE before submission
- Only the order creator can decrypt their order details
- All encryption/decryption operations require wallet signature authentication
- Smart contract uses `FHE.allow()` for fine-grained access control

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: Report bugs or request features
- **Zama Discord**: [discord.gg/zama](https://discord.gg/zama)
