# Deployment

## 1. Deploy the contract

1. Go to [studio.genlayer.com/contracts](https://studio.genlayer.com/contracts).
2. Upload or paste `contracts/recallguard_contract.py`.
3. Deploy to StudioNet, providing a `treasury_address` (any address you control) as the
   constructor argument. `min_position_stake_wei` / `min_evidence_stake_wei` can both be left at
   `0` unless you want a platform-wide minimum.
4. Copy the deployed contract address from Studio's confirmation screen.

Before deploying, it's worth exercising every write method once in Studio's own **Run and Debug**
panel — this is the only way to catch a runtime-only issue (real validator disagreement, storage
pickling) that a static read-through of the code can't surface. This isn't required, but it's
cheap and catches problems earlier than a full frontend round-trip would.

## 2. Point the frontend at it

Edit `src/config/chains.ts`:

```ts
export const CONTRACT_ADDRESS = '0xYourDeployedAddressHere';
```

This is the only file that needs editing — there's no `.env` file and no environment variable to
keep in sync.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Deploy the frontend

Push this repo to GitHub, then import it into Vercel. `vercel.json` already includes the SPA
rewrite rule Vite's client-side routing needs. No environment variables are required.

## Testing status

The contract has been statically audited against this project's full ten-item nondet-safety
checklist and is deployed to StudioNet at
[`0x008DA77B7973A6601CAc312731EFf46537a1356a`](https://explorer-studio.genlayer.com/address/0x008DA77B7973A6601CAc312731EFf46537a1356a).
It has **not yet been run against live multi-validator consensus** — no dispute has been created
or adjudicated yet. Treat every write path as unverified until it's been exercised at least once,
ideally in Studio's Run and Debug panel before going through the frontend, and ideally against a
real CPSC recall number (a currently-open recall, a closed one with a real fix, and one that's
been withdrawn as a false positive are three genuinely different cases worth trying).
