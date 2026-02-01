# What to do

1) Place `app/layout.tsx` exactly at the project root `app/` folder (App Router).
2) Ensure your global stylesheet exists at `styles/globals.css`.
   - If your file is in a different path (ex: `app/globals.css`), change the import path in `app/layout.tsx`.
3) Redeploy on Vercel.

Why this fixes it:
- In Next.js App Router, global CSS must be imported in `app/layout.tsx`.
