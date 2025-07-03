import { Actor, Action } from "@svylabs/ilumina";
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as config from './config.json';

interface SolanaAccount {
  id: string;
  keypair: Keypair;
  publicKey: PublicKey;
  balance: number;
}

export function setupActors(config: any, accounts: SolanaAccount[], program: Program): Actor[] {
  let idx = 0;
  const actors: Actor[] = [];

  // Helper to generate PDA for counter account
  const getCounterPda = (userPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), userPubkey.toBuffer()],
      program.programId
    );
    return pda;
  };

  for (const [actorType, count] of Object.entries(config.actors)) {
    for (let i = 0; i < Number(count); i++) {
      const account = accounts[idx++];
      
      // Simple actions for testing
      const actions = [
        new Action('initialize_counter', async () => {
          try {
            const counterPda = getCounterPda(account.publicKey);
            await program.methods.initialize(new anchor.BN(0))
              .accounts({
                counter: counterPda,
                user: account.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([account.keypair])
              .rpc();
            console.log(`Actor ${account.id} initialized counter`);
          } catch (error) {
            console.error(`Initialization failed for ${account.id}:`, error);
          }
        }, 100), // 100% probability
        
        new Action('increment_counter', async () => {
          try {
            const counterPda = getCounterPda(account.publicKey);
            await program.methods.increment()
              .accounts({
                counter: counterPda,
              })
              .signers([account.keypair])
              .rpc();
            console.log(`Actor ${account.id} incremented counter`);
          } catch (error) {
            console.error(`Increment failed for ${account.id}:`, error);
          }
        }, 100) // 100% probability
      ];

      actors.push(new Actor(
        account.id,
        {
          type: (actorType === "user" || actorType === "admin") ? "key" : "contract",
          address: account.publicKey.toString(),
          value: account.keypair
        },
        actions
      ));
    }
  }

  return actors;
}