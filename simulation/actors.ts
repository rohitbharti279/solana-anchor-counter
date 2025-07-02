import { Actor, Action } from "@svylabs/ilumina";
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import * as config from './config.json';

export function setupActors(config: any, accounts: any[], program: Program): Actor[] {
   let idx = 0;
   const actors: Actor[] = [];
   
//    for (const [actorType, count] of Object.entries(config.actors)) {
//      for (let i = 0; i < Number(count); i++) {
//        const account = accounts[idx++];
//        actors.push(new Actor(
//          `actor-${idx}`,
//          {
//            type: actorType as string,
//            keypair: account.keypair,
//            publicKey: account.publicKey
//          },
//          [] // Actions would go here
//        ));
//      }
//    }

   return actors;
}