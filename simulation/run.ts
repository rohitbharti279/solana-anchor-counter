#!/usr/bin/env node
import { Actor, Runner, Environment } from "@svylabs/ilumina";
import type { Account, RunContext, Hooks } from "@svylabs/ilumina";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as config from "./config.json";
import { setupActors } from "./actors";
import idlJson from "../target/idl/solana_counter.json";
import type { SolanaCounter } from "../target/types/solana_counter";

// Define expected config types
interface SolanaRunnerOptions {
  iterations: number;
  network: string;
  commitment: anchor.web3.Commitment;
  programId: string;
}

interface SolanaAccount extends Account {
  id: string;
  keypair: Keypair;
  publicKey: PublicKey;
  balance: number;
}

class SolanaSnapshotProvider {
  async capture() {
    // Snapshot logic (optional or manual for now)
  }

  async restore() {
    // Restore logic
  }
}

// Modern Solana airdrop with recommended confirmation strategy
async function airdrop(connection: Connection, publicKey: PublicKey, sol = 10) {
  // Request an airdrop of SOL to the given public key
  const sig = await connection.requestAirdrop(
    publicKey,
    anchor.web3.LAMPORTS_PER_SOL * sol
  );
  // Use the latest blockhash and lastValidBlockHeight for confirmation (recommended by Solana)
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: sig,
  });
}

async function main() {
  if (!config.actors || !config.options) {
    throw new Error("Invalid config structure");
  }

  const opts = config.options as SolanaRunnerOptions;

  // Setup connection and provider
  const connection = new Connection(
    opts.network || "http://localhost:8899",
    opts.commitment || "confirmed"
  );
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: opts.commitment || "confirmed",
  });
  anchor.setProvider(provider);

  // Load program
  const idl = idlJson as anchor.Idl;
  const programId = new anchor.web3.PublicKey(config.programId);
  const program = new anchor.Program(idl, provider);

  // Prepare test accounts
  const totalActors = Object.values(config.actors).reduce(
    (sum, count) => sum + count,
    0
  );
  const accounts: SolanaAccount[] = [];

  for (let i = 0; i < totalActors; i++) {
    const keypair = Keypair.generate();
    await airdrop(connection, keypair.publicKey);
    accounts.push({
      id: `account_${i}`,
      keypair,
      publicKey: keypair.publicKey,
      balance: 0, // Will be airdropped
    });
  }

  // Setup environment and actors
  const env = new Environment();
  const actors = setupActors(config, accounts, program);

  for (const actor of actors) {
    env.addAgent(actor);
  }

  // Add program as an agent for state tracking
  env.addAgent(
    new Actor(
      "program",
      {
        type: "program",
        // address: programId.toBase58(),
        address: programId.toString(),
        value: program,
      },
      []
    )
  );

  // Hooks before/after iteration
  const snapshotProvider = new SolanaSnapshotProvider();
  const hooks: Hooks = {
    beforeIteration: async (context: RunContext) => {
      console.log(`Starting iteration ${context.iter + 1}/${opts.iterations}`);
    },
    afterIteration: async (context: RunContext) => {
      console.log(`Completed iteration ${context.iter + 1}/${opts.iterations}`);
    },
  };

  // Start runner
  const runner = new Runner(program, actors, snapshotProvider, opts, hooks);
  await runner.run();
}

main()
  .then(() => {
    console.log("Simulation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Simulation failed:", error);
    process.exit(1);
  });
