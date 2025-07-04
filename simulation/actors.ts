// Patch Solana Connection to avoid circular JSON errors
import { Connection } from '@solana/web3.js';

if (typeof (Connection.prototype as any).toJSON !== 'function') {
  (Connection.prototype as any).toJSON = function () { return '[SolanaConnection]'; };
}

import { Actor, Action } from "@svylabs/ilumina";
import type { ExecutionReceipt } from "@svylabs/ilumina";
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

// Concrete Action for initializing the counter
class InitializeCounterAction extends Action {
  account: SolanaAccount;
  program: Program;
  constructor(account: SolanaAccount, program: Program) {
    super('_initialize');
    this.account = account;
    this.program = program;
  }
  async execute(context: any, actor: any, snapshot: any, actionParams: any): Promise<ExecutionReceipt> {
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), this.account.publicKey.toBuffer()],
        this.program.programId
      );
      const tx = await this.program.methods.initialize(new anchor.BN(0))
        .accounts({
          counter: pda,
          user: this.account.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([this.account.keypair])
        .rpc();
      return { receipt: tx };
    } catch (error) {
      return { receipt: (error && error.message) ? error.message : String(error) };
    }
  }
  async initialize(context: any, actor: any, snapshot: any): Promise<[boolean, any, Record<string, any>]> {
    return [true, null, {}];
  }
  async validate(context: any, actor: any, prev: any, next: any, params: any, receipt: any): Promise<boolean> {
    return true;
  }
}

// Concrete Action for incrementing the counter
class IncrementCounterAction extends Action {
  account: SolanaAccount;
  program: Program;
  constructor(account: SolanaAccount, program: Program) {
    super('_increment');
    this.account = account;
    this.program = program;
  }
  async execute(context: any, actor: any, snapshot: any, actionParams: any): Promise<ExecutionReceipt> {
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), this.account.publicKey.toBuffer()],
        this.program.programId
      );
      const tx = await this.program.methods.increment()
        .accounts({ counter: pda })
        .signers([this.account.keypair])
        .rpc();
      return { receipt: tx };
    } catch (error) {
      return { receipt: (error && error.message) ? error.message : String(error) };
    }
  }
  async initialize(context: any, actor: any, snapshot: any): Promise<[boolean, any, Record<string, any>]> {
    return [true, null, {}];
  }
  async validate(context: any, actor: any, prev: any, next: any, params: any, receipt: any): Promise<boolean> {
    return true;
  }
}

export function createSolanaActor(account: SolanaAccount, program: Program): Actor {
  const actions = [
    { action: new InitializeCounterAction(account, program), probability: 1.0 },
    { action: new IncrementCounterAction(account, program), probability: 1.0 }
  ];

  // Only include serializable fields in the account object
  const minimalAccount = {
    id: account.id,
    address: account.publicKey.toString(),
    type: "key" as const,
    value: account.publicKey.toString() // serializable value
    // Do NOT include keypair, program, or publicKey object here
  };

  const actor = new Actor(
    account.id,
    minimalAccount,
    actions
  );
  // (actor as any)._initialize = actions[0].action.execute.bind(actions[0].action);
  // (actor as any)._increment = actions[1].action.execute.bind(actions[1].action);
  return actor;
}

export function setupActors(
  config: any,
  accounts: SolanaAccount[],
  program: Program
): Actor[] {
  const actors: Actor[] = [];
  let idx = 0;
  for (const [actorType, count] of Object.entries(config.actors)) {
    for (let i = 0; i < Number(count); i++) {
      const account = accounts[idx++];
      actors.push(createSolanaActor(account, program));
    }
  }
  console.log(`🎭 Created ${actors.length} actors with counter actions`);
  return actors;
}