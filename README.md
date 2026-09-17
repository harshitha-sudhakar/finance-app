# Runway

Runway is a cash-flow forecasting app you can demo in an interview. It models a signed-in customer's **account balances**, **income**, and **obligations**, then projects **30 / 60 / 90 day** cash flow and flags dates where the lower-confidence path goes below zero.

It is built to match this story:

> Engineered a financial platform with Firebase authentication and a Nessie API data pipeline across 5 domains to enable configurable 30/60/90 day cash-flow forecasting. Modeled customer-specific account balances, income, and transaction data to identify projected shortfalls.

## What was broken

Adding accounts and logging income used to fail when Firebase/Firestore was required and not configured. Writes now persist **immediately in the browser**, scoped to the signed-in user. If Firebase is configured, Auth is used for identity and Firestore is a best-effort sync — it cannot block the demo.

## What Nessie actually does

[Nessie](http://api.nessieisreal.com/) is **Capital One's hackathon sandbox**, not a live bank connection. You cannot log into a real Capital One account with it. You get a key, create mock customers, and then read a banking resource graph that resembles Capital One's internal APIs.

Runway treats Nessie as the **source-of-truth pipeline** for five domains:

| Domain | Nessie resource | What Runway uses it for |
| --- | --- | --- |
| Customer | `/customers/{id}` | Who this sandbox person is |
| Accounts / balances | `/customers/{id}/accounts` | Starting liquid cash |
| Bills | `/accounts/{id}/bills` | Recurring obligations (rent, loans) |
| Deposits | `/accounts/{id}/deposits` | Income streams; cadence is inferred |
| Purchases | `/accounts/{id}/purchases` | Historical daily-spend estimate |

The snapshot endpoint fans those calls out with `Promise.allSettled`, so an empty bills list does not take down deposits or purchases. Open **Nessie pipeline** in the app, fetch a snapshot, then apply it to the signed-in customer.

Without `NESSIE_API_KEY`, the same five-domain JSON is served from a bundled fixture so the demo still works. Get a free key at [api.nessieisreal.com](http://api.nessieisreal.com/) (GitHub login), then set it in `.env.local`.

## Interview demo (5 minutes)

1. Open the app → **Open interview demo**. This loads Maya Chen with rent due before payday.
2. Dashboard: explain the status card first, then the projected-balance chart. The interface leads with the result instead of every input.
3. Financial data: add an account, income item, or bill live. That proves the customer model is writable.
4. Nessie pipeline: fetch the five-domain snapshot and explain `Promise.allSettled`.
5. Forecast: switch 30 → 60 → 90. Shortfall dates are the punchline.
6. Sandbox: pull payday to today without saving. The shortfall disappears. That is the "timing gap, not insolvency" line.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — demo works with empty values
npm run dev
```

App: [http://127.0.0.1:45217](http://127.0.0.1:45217)

Create an empty account from the landing page if you want to add accounts and income from scratch.

## Deploy (Vercel)

This is a standard Next.js app. The fastest interview-ready deploy:

1. Push this repo to GitHub / GitLab.
2. Import the project in [Vercel](https://vercel.com/new). Framework preset: Next.js. Build command `next build`, output is automatic.
3. You can deploy with **no env vars**. Interview demo, local accounts, income, and the Nessie fixture all work.
4. Optional production keys (Project → Settings → Environment Variables):

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NESSIE_API_KEY
NESSIE_CUSTOMER_ID
```

5. Redeploy. The sign-in card will say **Firebase Authentication is configured** when the web keys are present.

CLI option:

```bash
npx vercel
```

Firebase setup (optional): create a Firebase project → Authentication → Email/Password → register a web app → paste the config into Vercel / `.env.local`. Firestore is optional; enable it only if you want server-side copies of each user's profile.

### Deployment scope

Use Vercel for the live demo. It matches the Next.js architecture, gives you a stable URL, and keeps the deployment understandable in an interview. Docker is optional only if you want to prove the app runs consistently outside Vercel; Kubernetes and Terraform would add infrastructure without solving a current product need.

## How the forecast works

Starting cash = sum of non-credit account balances.

Each day in the selected 30, 60, or 90-day period:

- **Expected**: income × certainty − obligations − daily spend from Nessie purchases
- **Lower band**: only ≥95% certain income − full obligations
- **Upper band**: full income − weighted obligations

A **shortfall** is a day where the lower band is below zero. A **buffer warning** is expected cash below the comfort slider (default $250).

The forecast also lives at `POST /api/forecast` so you can talk about it as a service boundary, not only UI math.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Firebase Auth (optional) with a local/demo auth adapter
- Nessie snapshot + import API routes
- Client-scoped financial records so the demo never depends on secrets
