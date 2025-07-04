#!/usr/bin/env node
import { Actor, Runner, Environment } from "@svylabs/ilumina";
import type { Account, RunContext, Hooks } from "@svylabs/ilumina";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { setupActors } from "./actors.js";
import config from "./config.json" with { type: "json" };
import idlJson from "../target/idl/solana_counter.json" with { type: "json" };
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
  type: "key" | "contract";
  address: string;
  value: any;
}

class SolanaSnapshotProvider {
  async snapshot() {
    // Return a dummy snapshot object matching the Snapshot interface
    return { contractSnapshot: {}, accountSnapshot: {} };
  }
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

// console.log("Type of config:", typeof config);
// console.log("Prototype:", Object.getPrototypeOf(config));
// console.log("Config raw object:", config);
// console.log("Config JSON:", JSON.stringify(config, null, 2));
// const idl = JSON.parse(JSON.stringify(idlJson));
// if (!idl.accounts) {
//   throw new Error("IDL is missing accounts definitions");
// }
// console.log("IDL JSON:", JSON.stringify(idlJson, null, 2));
// console.log("IDL type:", typeof idlJson);
// console.log("IDL accounts:", idl.accounts);

async function main() {
  try {
    console.log("Starting Solana simulation...");

    if (typeof config !== 'object' || !config.actors || !config.options) {
      throw new Error("Invalid config.json structure — missing actors or options");
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
    console.log("connection successfully established", connection.rpcEndpoint);

    // Load and validate IDL

    const idl = idlJson as anchor.Idl;
    if (!idl) {
      throw new Error("IDL is missing or invalid");
    }
    console.log("IDL successfully loaded:", idl);
    // console.log("IDL JSON:", JSON.stringify(idlJson, null, 2));

    const programId = new anchor.web3.PublicKey(config.programId);
    console.log("Program ID:", programId.toString());
    // const program = new anchor.Program(idl, programId, provider);
    const program = new Program(idl as SolanaCounter, provider);
    console.log("Program successfully loaded:", program);

    // Prepare test accounts
    console.log("Preparing test accounts...");
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
        type: "key",
        address: keypair.publicKey.toString(),
        value: keypair,
      });
    }

    // Setup environment and actors
    console.log("Setting up environment and actors...");
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
          type: "contract", // must be 'key' or 'contract'
          address: programId.toString(),
          value: program,
        },
        []
      )
    );

    // Hooks before/after iteration
    console.log("Setting up snapshot provider and hooks...");
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
    console.log("Starting simulation runner...");
    const runner = new Runner(program, actors, snapshotProvider, opts, hooks);
    console.log("Running simulation with options:", opts);
    await runner.run();
    console.log("Simulation completed successfully");
  } catch (error) {
    console.error("Detailed error:", error);
    process.exit(1);
  }
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
