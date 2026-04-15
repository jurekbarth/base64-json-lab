# 64 Lab

Small browser-based Base64 utility for:

- Decoding Base64 into text
- Decoding Base64 into formatted JSON
- Encoding text to Base64
- Encoding JSON to Base64

## Local use

Open `index.html` directly in your browser.

## Vercel

From this folder:

```bash
cd /Users/jurekbarth/dev/tado/temp-tado/64
npx vercel
```

That creates a preview deployment and links the project to your Vercel account.

Target domain for this project:

```text
64.v10.app
```

After the project is linked, attach the domain:

```bash
vercel domains add 64.v10.app 64-lab
```

Then check the required DNS configuration:

```bash
vercel domains inspect 64.v10.app
```

If `v10.app` is already managed in Vercel DNS, that may be enough or Vercel will guide you to the needed record automatically. If `v10.app` is managed elsewhere, add the DNS record Vercel shows in the `inspect` step.

## GitHub Actions pipeline

The repository includes a workflow that:

- Deploys preview builds to Vercel for non-`main` branch pushes
- Deploys production to Vercel for pushes to `main`

Before the pipeline can run successfully, add these GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You can get the project and org IDs by running:

```bash
vercel link
cat .vercel/project.json
```

For local Vercel preview mode:

```bash
npm run dev
```

For a production deployment:

```bash
npm run deploy
```

If you prefer not to use `npx`, install the Vercel CLI globally first:

```bash
npm install -g vercel
```
