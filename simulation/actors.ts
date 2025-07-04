import { Actor, Action } from "@svylabs/ilumina";
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import config from './config.json' with { type: 'json' };

interface SolanaAccount {
  id: string;
  keypair: Keypair;
  publicKey: PublicKey;
  balance: number;
}

export function setupActors(
  config: any, 
  accounts: SolanaAccount[], 
  program: Program
): Actor[] {
  const actors: Actor[] = [];
  let accountIndex = 0;

  // Helper function to derive PDA for each actor's counter
  const getCounterPda = (userPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), userPubkey.toBuffer()],
      program.programId
    );
    return pda;
  };

  for (const [actorType, count] of Object.entries(config.actors)) {
    for (let i = 0; i < Number(count); i++) {
      const account = accounts[accountIndex++];
      
      // Define actions for each actor
      const actions = [
        new Action(
          'initialize',
          async () => {
            try {
              const counterPda = getCounterPda(account.publicKey);
              const tx = await program.methods.initialize(new anchor.BN(0))
                .accounts({
                  counter: counterPda,
                  user: account.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([account.keypair])
                .rpc();
              
              console.log(`✅ Actor ${account.id} initialized counter. Tx: ${tx}`);
              return tx;
            } catch (error) {
              console.error(`❌ Initialization failed for ${account.id}:`, error);
              throw error;
            }
          },
          100 // 100% probability
        ),
        new Action(
          'increment',
          async () => {
            try {
              const counterPda = getCounterPda(account.publicKey);
              const tx = await program.methods.increment()
                .accounts({
                  counter: counterPda,
                })
                .signers([account.keypair])
                .rpc();
              
              console.log(`🔢 Actor ${account.id} incremented counter. Tx: ${tx}`);
              return tx;
            } catch (error) {
              console.error(`❌ Increment failed for ${account.id}:`, error);
              throw error;
            }
          },
          100 // 100% probability
        )
      ];

      // Create actor with properly initialized properties
      actors.push(new Actor(
        account.id,
        {
          type: "key",
          address: account.publicKey.toString(),
          value: account.keypair
        },
        actions
      ));
    }
  }

  console.log(`🎭 Created ${actors.length} actors with counter actions`);
  return actors;
}