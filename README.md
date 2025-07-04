# Solana Counter Simulation

## Workflow

1. **Start the Solana Local Validator**

   Open a terminal and run:
   ```bash
   solana-test-validator --reset
   ```

2. **Clean previous builds**

   ```bash
   anchor clean
   rm -rf target/idl
   ```

3. **Rebuild and deploy the program**

   ```bash
   anchor build
   anchor deploy
   ```

4. **Verify deployment**

   ```bash
   solana program show --programs
   ```

5. **Run the Simulation**

   Open another terminal in this project directory and run:
   ```bash
   export ANCHOR_WALLET=~/.config/solana/id.json
   npx tsx simulation/run.ts
   ```
   Or, using npm script:
   ```bash
   npm run start
   ```

---

Make sure your Anchor wallet is set up and your local validator is running before starting the simulation.
