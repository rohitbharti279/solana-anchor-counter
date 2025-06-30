import * as anchor from '@coral-xyz/anchor';
import * as assert from "assert";
import { Program } from '@coral-xyz/anchor';
import { SolanaCounter } from '../target/types/solana_counter';

describe('solana-counter', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaCounter as Program<SolanaCounter>;

  it('Initializes the counter', async () => {
    const counter = anchor.web3.Keypair.generate();
    const initialValue = 5;

    await program.methods.initialize(initialValue)
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    assert.equal(account.count, initialValue);
  });

  it('Increments the counter', async () => {
    const counter = anchor.web3.Keypair.generate();
    const initialValue = 5;

    await program.methods.initialize(initialValue)
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([counter])
      .rpc();

    await program.methods.increment()
      .accounts({
        counter: counter.publicKey,
      })
      .rpc();

    const account = await program.account.counter.fetch(counter.publicKey);
    assert.equal(account.count, initialValue + 1);
  });
});