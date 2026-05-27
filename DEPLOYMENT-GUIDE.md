# Two Covers — Deployment Guide

This takes the project from a folder of files to a live website with its
own URL. No coding. Roughly 30–45 minutes. Everything used here is free.

You will create three free accounts: **GitHub**, **Supabase**, **Vercel**.

Work through it in order. Do not skip ahead — later steps need values
from earlier ones. There are checkpoints marked ✅ — make sure each one
is true before moving on.

---

## STEP 0 — Get the project onto your computer

You should have downloaded the `two-covers` folder. Put it somewhere you
can find it, e.g. your Desktop. Do not rename the folder or the files
inside it.

✅ You have a folder called `two-covers` with files like `package.json`
   and a `app` folder inside it.

---

## STEP 1 — GitHub: store the code

GitHub is where the code lives. Vercel reads from it.

1. Go to **github.com** and sign up (free). Verify your email.
2. Once logged in, click the **+** at the top-right → **New repository**.
3. Repository name: `two-covers`. Leave it **Public** (this is just code,
   not your data — the data lives in Supabase). Do NOT tick "Add a README".
4. Click **Create repository**.
5. On the next page, find the link **uploading an existing file**
   (in the line "…or push an existing repository / uploading an existing file").
6. Open your `two-covers` folder. Select ALL the files and folders inside
   it, and drag them into the GitHub upload box.
   - IMPORTANT: drag the *contents* of the folder, not the folder itself.
   - If you see a `node_modules` folder, do not upload it (it is huge and
     not needed). The `.gitignore` file tells tools to skip it anyway.
7. Scroll down, click **Commit changes**.

✅ Your GitHub repository page shows `app`, `lib`, `package.json`, etc.

---

## STEP 2 — Supabase: create the database

Supabase holds the restaurant entries.

1. Go to **supabase.com** → **Start your project** → sign in (you can use
   your GitHub account to sign in — easiest).
2. Click **New project**.
   - Name: `two-covers`
   - Database password: click Generate, then COPY IT somewhere safe.
     (You won't need it for this guide, but keep it.)
   - Region: pick the one closest to you (e.g. London).
3. Click **Create new project**. Wait ~2 minutes while it sets up.
4. When ready, in the left sidebar click **SQL Editor**.
5. Click **+ New query**. Open the file `supabase-setup.sql` from your
   project folder, copy ALL of it, paste it into the editor.
6. Click **Run** (bottom-right). You should see "Success. No rows returned".
7. In the left sidebar click **Table Editor** → you should see a
   `restaurants` table with Carbone and Imoto already in it.

✅ The `restaurants` table exists and shows 2 rows.

### Now collect three values you'll need in Step 3:

8. Left sidebar → **Project Settings** (the gear) → **Data API**.
   - Copy the **Project URL**. Paste it into a notes file, labelled URL.
9. Still in Project Settings → **API Keys**.
   - Copy the **anon / public** key → notes file, labelled ANON.
   - Copy the **service_role** key → notes file, labelled SERVICE.
     (This one is secret — don't share it.)

✅ Your notes file has three values: URL, ANON, SERVICE.

---

## STEP 3 — Vercel: put the site live

Vercel turns the code into a real website.

1. Go to **vercel.com** → **Sign Up** → continue with **GitHub**
   (this lets Vercel see your repository).
2. On your Vercel dashboard click **Add New… → Project**.
3. Find `two-covers` in the list of your GitHub repositories → **Import**.
4. Before clicking Deploy, expand the **Environment Variables** section.
   Add these four, one at a time (Name on the left, Value on the right):

   | Name                            | Value                          |
   |---------------------------------|--------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`      | your URL from Step 2           |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your ANON key from Step 2      |
   | `SUPABASE_SERVICE_KEY`          | your SERVICE key from Step 2   |
   | `EDIT_PASSWORD`                 | a password you and Rachel pick |

   - Type each Name EXACTLY as shown (they are case-sensitive).
   - For `EDIT_PASSWORD`, choose any password. This is what unlocks
     adding and editing. Tell Rachel what it is.
5. Click **Deploy**. Wait ~1–2 minutes.
6. When it finishes you'll see a celebration screen with a preview.
   Click it, or click **Continue to Dashboard** → **Visit**.

✅ Your site loads at a URL like `two-covers-xxxx.vercel.app` and shows
   Carbone and Imoto.

---

## STEP 4 — Test it

On the live site:

1. You should SEE the rankings without logging in. Good — that's public.
2. Click **Record a Visit**. Fill in a test restaurant.
3. At the bottom, the password field: type your `EDIT_PASSWORD`.
4. Click **Commit to Ledger**. It should save and appear in the list.
5. Open it again, click **Amend**, change something, save with the
   password. Then try **Strike** to delete it.
6. Try saving with the WRONG password — it should refuse. Good.

✅ You can add/edit/delete with the password, and the public cannot.

---

## You're live

Share the `.vercel.app` URL with anyone — they see the rankings.
Only you and Rachel, with the password, can change anything.

### Optional niceties (later, no rush)
- **Custom domain**: Vercel → Project → Settings → Domains. You can buy
  something like `twocovers.co` and point it here.
- **Editing the site**: change a file on GitHub (pencil icon → edit →
  commit). Vercel rebuilds automatically in about a minute.
- **Changing the password**: Vercel → Settings → Environment Variables →
  edit `EDIT_PASSWORD` → then Deployments → Redeploy.

### A note on the free tier
Supabase pauses a database after ~1 week of zero activity. If the site
ever looks empty, log in to Supabase and click **Restore** — one click,
takes a minute. Visiting the site regularly keeps it awake.

---

## If something goes wrong

- **Site shows an error / no restaurants**: almost always a typo in one of
  the four environment variable Names or Values. Vercel → Settings →
  Environment Variables, check them, then Deployments → Redeploy.
- **"Wrong password" when you know it's right**: the `EDIT_PASSWORD` value
  in Vercel may have a stray space. Re-enter it and redeploy.
- **Build failed in Vercel**: open the build log, copy the red error text,
  and send it to me — I'll tell you the fix.
