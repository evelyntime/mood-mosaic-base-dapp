# Mood Mosaic Deployment Notes

App Name: Mood Mosaic
Tagline: Stamp a mood
Description: Stamp a colorful mood tile with color, note, wallet, and time on Base, then browse the public mosaic by ID.

## Required env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0bed2de2b4a22f3ba56ec4
NEXT_PUBLIC_BUILDER_CODE=bc_ehgxix3y
NEXT_PUBLIC_MOOD_MOSAIC_CONTRACT_ADDRESS=0x26c91dd1d23afe649fe8e9f48a22d904996f266e
BASE_RPC_URL=replace_with_rpc_url
```

## Order

1. Add Base App ID after Base.dev shows it.
2. Link and deploy with the Vercel token in `Vercel.txt`.
3. Run `npm run deploy:contract`.
4. Add `NEXT_PUBLIC_MOOD_MOSAIC_CONTRACT_ADDRESS` to Vercel Production.
5. Add Builder Code after Base.dev shows it.
6. Deploy again with `vercel --prod --token=...`.
