# Two Covers

A restaurant ranking website, kept by two. Public to view, password-protected to edit.

## What it is

- A public website anyone can visit to see the restaurant rankings.
- Only people with the shared password can add, amend, or strike entries.
- Six scoring categories: Vibes, Food, Menu, Drinks, Service, Bathroom.
- Categories can be marked "n/a" and are then excluded from the total.

## Tech

- **Next.js** — the website framework.
- **Supabase** — the database that holds the restaurants (free tier).
- **Vercel** — hosts the site and gives it a public URL (free tier).

## Setting it up

Follow `DEPLOYMENT-GUIDE.md` step by step. It walks through creating the
accounts, the database, and going live. No coding required.

## The four environment variables

See `.env.example`. These get pasted into Vercel, not into any file.

## Editing later

Change a file on GitHub and Vercel redeploys automatically within a minute.
