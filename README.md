# Solana Counter Simulation

## Quick Start

### 1. Start the Solana Local Validator

Open a terminal and run:

```bash
solana-test-validator --reset
```

### 2. Run the Simulation

Open another terminal in this project directory and run:

```bash
export ANCHOR_WALLET=~/.config/solana/id.json
npx tsx simulation/run.ts
```

### Alternative: Using npm script

You can also run:

```bash
npm run start
```

---

Make sure your Anchor wallet is set up and your local validator is running before starting the simulation.
