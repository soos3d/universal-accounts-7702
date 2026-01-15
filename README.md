# Universal Accounts with EIP-7702

A demo showcasing **EIP-7702 mode** with [Particle Network's Universal Accounts](https://developers.particle.network/universal-accounts/cha/overview) and [Privy](https://privy.io) authentication.

## 🎯 What is EIP-7702 Mode?

**EIP-7702** allows an EOA (Externally Owned Account) to be **upgraded to act directly as a smart account** without deploying a separate contract or transferring assets.

### The Magic: Your EOA = Your Universal Account

```
Traditional Smart Accounts:
User EOA (0xABC...) → Deploy Smart Account (0xDEF...) → Transfer assets → Use features
❌ Multiple addresses, asset transfers required, friction

EIP-7702 Mode:
User EOA (0xABC...) → Authorize delegation → EOA becomes Universal Account
✅ Same address, no transfers, zero friction
```

## 🚀 UX Benefits

### For Users
- **No asset transfers**: Your existing EOA address instantly gains smart account features
- **Same address everywhere**: Your EOA address IS your Universal Account address
- **Immediate access**: Assets already in your EOA are instantly usable across chains
- **Zero friction onboarding**: Sign once to authorize, then enjoy chain abstraction

### For Developers
- **Simpler integration**: No need to explain "transfer to smart account"
- **Better retention**: Users don't abandon due to asset transfer friction
- **Unified address**: No confusion about which address to use
- **Progressive enhancement**: EOAs gain superpowers without breaking existing functionality

## 🔑 Key Features

- **Chain Abstraction**: Swap/bridge assets across 15+ chains from a single interface
- **Unified Balance**: View all your assets across EVM + Solana in one place
- **Gas Abstraction**: Pay gas in any token (coming soon)
- **Social Login**: Privy authentication with email, Google, Twitter
- **Embedded Wallets**: Automatic wallet creation on login

## 🏗️ How It Works

### 1. Initialize Universal Account (7702 Mode)

```typescript
const ua = new UniversalAccount({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
  projectAppUuid: process.env.NEXT_PUBLIC_APP_ID!,
  smartAccountOptions: {
    useEIP7702: true,  // 🎯 Enable 7702 mode
    name: "UNIVERSAL",
    version: UNIVERSAL_ACCOUNT_VERSION,
    ownerAddress: wallet.address,  // Your EOA becomes the Universal Account
  },
  tradeConfig: { slippageBps: 100, universalGas: true },
});
```

### 2. First Transaction: Authorize Delegation

On the first transaction, the EOA authorizes the Universal Account implementation to act on its behalf:

```typescript
// Create a cross-chain transaction (e.g., swap to USDT on BSC)
const transaction = await universalAccount.createConvertTransaction({
  expectToken: { type: SUPPORTED_TOKEN_TYPE.USDT, amount: '0.1' },
  chainId: CHAIN_ID.BSC_MAINNET,
});

// Handle 7702 Authorization using Privy's signAuthorization
const authorizations: EIP7702Authorization[] = [];
const nonceMap = new Map<number, string>();

for (const userOp of transaction.userOps) {
  if (!!userOp.eip7702Auth && !userOp.eip7702Delegated) {
    let signatureSerialized = nonceMap.get(userOp.eip7702Auth.nonce);
    if (!signatureSerialized) {
      // Use Privy's signAuthorization hook which handles nonces properly
      const authorization = await signAuthorization(
        {
          contractAddress: userOp.eip7702Auth.address as `0x${string}`,
          chainId: Number(userOp.eip7702Auth.chainId),
          nonce: userOp.eip7702Auth.nonce,
        },
        {
          address: embeddedWallet.address,
        }
      );

      // Serialize the authorization signature (r, s, v components) into a hex string
      const sig = Signature.from({
        r: authorization.r,
        s: authorization.s,
        v: authorization.v ?? BigInt(authorization.yParity),
        yParity: authorization.yParity as 0 | 1,
      });
      signatureSerialized = sig.serialized;
      nonceMap.set(userOp.eip7702Auth.nonce, signatureSerialized);
    }

    if (signatureSerialized) {
      authorizations.push({
        userOpHash: userOp.userOpHash,
        signature: signatureSerialized,
      });
    }
  }
}

// Sign the transaction root hash
const { signature } = await signMessage(
  { message: transaction.rootHash },
  {
    uiOptions: { title: "Convert transaction on BSC" },
    address: embeddedWallet.address,
  }
);

// Send the transaction
const result = await universalAccount.sendTransaction(
  transaction,
  signature,
  authorizations
);
```

### 3. What Happens Under the Hood

1. **Authorization Check**: SDK checks if EOA has delegated to Universal Account on target chains
2. **Sign Authorization**: User signs EIP-7702 authorization (only needed once per chain)
3. **EOA Upgrade**: EOA's code is temporarily set to the Universal Account implementation
4. **Execute Transaction**: Transaction executes with smart account features (batching, gas abstraction, etc.)
5. **Revert Code**: After transaction, EOA code reverts to normal (or stays delegated for future txs)

### 4. Subsequent Transactions

After the first authorization, subsequent transactions on the same chain don't require re-authorization:

```typescript
// Check deployment status
const deployments = await universalAccount.getEIP7702Deployments();
console.log("Deployments:", deployments);
// [{ chainId: 56, isDelegated: true, delegationAddress: "0x..." }]

// Future transactions on BSC don't need authorization again
const tx2 = await universalAccount.createConvertTransaction({
  expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: '1' },
  chainId: CHAIN_ID.BSC_MAINNET,
});
// No authorization needed, just sign and send!
```

## 📊 Mode Comparison

| Feature | 7702 Mode (This Demo) | Smart Account Mode |
|---------|----------------------|-------------------|
| **Account Address** | Same as EOA | Separate address |
| **Asset Transfer Required** | ❌ No | ✅ Yes |
| **Onboarding Friction** | Zero | High |
| **JSON-RPC Wallet Support** | Limited | Full |
| **User Experience** | Seamless | Requires education |
| **Recommended For** | Most applications | Legacy compatibility |

## 🛠️ Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment Variables

Create a `.env` file (use `.env.example` as template):

```bash
# Particle Network (for Universal Accounts SDK)
NEXT_PUBLIC_PROJECT_ID="your-particle-project-id"
NEXT_PUBLIC_CLIENT_KEY="your-particle-client-key"
NEXT_PUBLIC_APP_ID="your-particle-app-id"

# Privy (for authentication)
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PUBLIC_PRIVY_CLIENT_ID="your-privy-client-id"
```

**Get Particle credentials**: https://dashboard.particle.network  
**Get Privy credentials**: https://dashboard.privy.io

### 3. Run the App

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎮 Try It Out

1. **Sign in** with Privy (email, Google, or Twitter)
2. **View your unified balance** across all chains
3. **Swap to any token** on any supported chain
4. **Watch the magic**: Your EOA executes cross-chain transactions without deploying contracts or transferring assets

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Privy Authentication                  │    │
│  │  (Social Login + Embedded Wallet Creation)     │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│                   ▼                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │      Universal Account SDK (7702 Mode)         │    │
│  │  • Initialize with EOA address                 │    │
│  │  • Create cross-chain transactions             │    │
│  │  • Handle EIP-7702 authorizations              │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│           Particle Network Backend                       │
│  • Chain abstraction orchestration                       │
│  • Cross-chain routing and execution                     │
│  • Gas abstraction (coming soon)                         │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Blockchain Networks                         │
│  Ethereum • Arbitrum • Base • Optimism • BSC            │
│  Polygon • Sonic • Berachain • Solana • 15+ chains      │
└─────────────────────────────────────────────────────────┘
```

## 📚 Learn More

- [Universal Accounts Documentation](https://developers.particle.network/universal-accounts/cha/overview)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Privy Documentation](https://docs.privy.io)
- [Universal Account Code Samples](https://github.com/Particle-Network/universal-account-examples)

## 🤝 Contributing

This is a demo project. Feel free to fork and experiment!

## 📄 License

MIT
