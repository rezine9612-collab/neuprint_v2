# NeuPrint MVP (Next.js)

## Run locally
```bash
npm install
npm run dev
```

## Pages
- `/` Start input
- `/analyze` Submit + request analysis
- `/report` Render the latest analysis result (reads from sessionStorage)

## Notes
- UI rendering is strictly presentational. Scoring/aggregation belongs to backend.
- If you see placeholders in `/report`, it means some fields were null or missing in the stored result.
