# DynFlow: Dynamic Liquidity NFTs

Transform static NFTs into active liquidity providers that auto-compound yield and evolve metadata based on performance.

## 🎯 What is DynFlow?

DynFlow converts static NFTs into active liquidity providers by integrating Uniswap V3 position management directly into the token standard. Users deposit ERC20 pairs to mint a unique NFT that represents the liquidity position, eliminating the need for separate LP tokens.

### Key Features

- **Auto-Compounding Yield**: Positions automatically compound yield without manual intervention
- **Dynamic Metadata**: NFT metadata updates via IPFS to reflect real-time APY, duration, and performance
- **NFT Marketplace Trading**: Trade liquidity positions seamlessly on NFT marketplaces
- **Full Custody**: Users maintain full custody of their positions
- **DeFi Composability**: Compatible with other DeFi protocols

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- MetaMask or compatible wallet
- Sepolia testnet ETH for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dynflow.git
cd dynflow

# Install dependencies
yarn install

# Compile contracts
yarn compile

# Run tests
yarn test
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_wallet_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Hardhat Configuration

The `hardhat.config.ts` file is pre-configured with:
- Sepolia testnet RPC endpoint
- Hardhat network configuration
- Etherscan API integration

## 📦 Deployment

### Deploy to Sepolia Testnet

```bash
# Set your private key in .env or as environment variable
export PRIVATE_KEY=your_private_key

# Deploy contracts
yarn deploy:sepolia
```

### Deploy to Mainnet

```bash
# Set your private key in .env or as environment variable
export PRIVATE_KEY=your_private_key

# Deploy contracts
yarn deploy:mainnet
```

### Deployment Addresses

After deployment, addresses are saved to `deploys.md`. Example:

```
Network: Sepolia
DynFlowVault: 0x...
DynFlowNFT: 0x...
```

## 🌐 RPC URLs

Use these public RPC endpoints for testing:

- **Sepolia**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- **Ethereum Mainnet**: `https://eth.llamarpc.com`
- **Hardhat Local**: `http://127.0.0.1:8545`

## 🖥️ Frontend Dashboard

### Start the Dashboard

```bash
# Open dashboard in browser
open public/dashboard.html  # macOS
xdg-open public/dashboard.html  # Linux
start public/dashboard.html  # Windows
```

### Dashboard Features

- View active liquidity positions
- Track real-time APY and yield
- Monitor NFT metadata evolution
- Position performance analytics

## 🧪 Testing

### Run All Tests

```bash
yarn test
```

### Run Specific Test File

```bash
yarn test test/DynFlow.test.js
```

### Test Coverage

```bash
yarn coverage
```

## 📁 Project Structure

```
dynflow/
├── contracts/
│   ├── DynFlowNFT.sol      # NFT contract with dynamic metadata
│   ├── DynFlowVault.sol    # Vault for liquidity management
│   └── base/               # Base contracts from Uniswap V3
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── DynFlow.test.js     # Test suite
├── public/
│   └── dashboard.html      # Frontend dashboard
├── hardhat.config.ts       # Hardhat configuration
└── package.json            # Dependencies
```

## 🔐 Security

### Audit Status

- **Status**: Pending audit
- **Target**: ABDK Smart Contracts audit
- **Timeline**: Q1 2026

### Security Best Practices

1. Never share your private key
2. Use testnet for development
3. Review contract code before deployment
4. Monitor positions regularly
5. Keep software dependencies updated

### Bug Bounty

We offer a bug bounty program for critical vulnerabilities. See [bug-bounty.md](./bug-bounty.md) for details.

## 📊 Contract Addresses

### Sepolia Testnet

| Contract | Address |
|----------|---------|
| DynFlowVault | See `deploys.md` |
| DynFlowNFT | See `deploys.md` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| DynFlowVault | TBA |
| DynFlowNFT | TBA |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 📞 Support

- **Documentation**: See inline contract comments
- **Issues**: Open on GitHub
- **Discord**: Join our community server
- **Email**: support@dynflow.io

## 🔄 Roadmap

- [x] Core vault contract
- [x] NFT contract with dynamic metadata
- [x] Deployment scripts
- [x] Frontend dashboard
- [x] Test suite
- [ ] IPFS metadata integration
- [ ] Multi-chain support
- [ ] Governance module
- [ ] Audit completion

## 🙏 Acknowledgments

- Uniswap V3 for position management
- OpenZeppelin for security contracts
- Hardhat for development tooling
- ETHGlobal for the hackathon opportunity

---

Built for ETHGlobal HackMoney 2026 | Uniswap Track