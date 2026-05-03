# n8n Google Calendar Setup — theburgmusic@gmail.com

This doc covers the one-time setup required before the multi-venue `gcal-to-db-sync` workflow
can read all 5 venue calendars. All group calendars are shared with `theburgmusic@gmail.com`,
so a single OAuth credential covers them all.

---

## Which Google auth type do I need?

| Type | Used for | Works here? |
|---|---|---|
| **API Key** | Public/read-only data (no login required) | ❌ Private calendars require auth |
| **Service Account** | Server-to-server access in Google Workspace domains | ❌ Can't access personal Gmail calendars |
| **OAuth 2.0 Client ID** | Apps that act on behalf of a signed-in Google user | ✅ This is what n8n uses |

You need an **OAuth 2.0 Client ID + Client Secret** from Google Cloud Console.

---

## Step 1 — Google Cloud Console: create OAuth 2.0 credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in as `theburgmusic@gmail.com`

2. **Create a project** (or select an existing one)
   - Click the project dropdown at the top → **New Project**
   - Name it something like `stpetemusic-n8n`
   - Click **Create**

3. **Enable the Google Calendar API**
   - In the search bar, search **"Google Calendar API"**
   - Click it → **Enable**

4. **Configure the OAuth consent screen**
   - Left sidebar → **APIs & Services** → **OAuth consent screen**
   - User type: **External** → **Create**
   - Fill in:
     - App name: `StPeteMusic n8n`
     - User support email: `theburgmusic@gmail.com`
     - Developer contact: `theburgmusic@gmail.com`
   - Click **Save and Continue** through Scopes (no changes needed)
   - Under **Test users**, click **Add users** → add `theburgmusic@gmail.com`
   - Click **Save and Continue** → **Back to Dashboard**

   > ⚠️ The app will stay in **Testing** mode which is fine — only the test users you added
   > can authorize it. You do NOT need to publish it.

5. **Create the OAuth 2.0 Client ID**
   - Left sidebar → **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `n8n-calendar-client`
   - Under **Authorized redirect URIs**, click **+ Add URI** and enter:
     ```
     https://n8n.stpetemusic.live/rest/oauth2-credential/callback
     ```
   - Click **Create**

6. **Copy your credentials**
   - A dialog shows your **Client ID** and **Client Secret** — copy both somewhere safe
   - You can also download the JSON file

---

## Step 2 — Share each calendar with theburgmusic@gmail.com

Log into Google Calendar at calendar.google.com for **each calendar account** (suite.e.stpete,
theburgmusic, etc.) and share the group calendar with `theburgmusic@gmail.com` as
**"See all event details"** (read-only is fine).

| Calendar | Owner account |
|---|---|
| Suite E Studios | suite.e.stpete@gmail.com |
| Blueberry Patch | theburgmusic@gmail.com (already owner) |
| Cage Brewing | theburgmusic@gmail.com (already owner) |
| Ruby's Elixir | theburgmusic@gmail.com (already owner) |
| The Bends | theburgmusic@gmail.com (already owner) |

To share: Google Calendar → click the three dots next to the calendar → **Settings and sharing**
→ **Share with specific people** → add `theburgmusic@gmail.com`.

---

## Step 3 — Create the n8n credential

1. Log into n8n at https://n8n.stpetemusic.live
2. Go to **Settings** → **Credentials** → **Add credential**
3. Search for and select **Google Calendar OAuth2 API**
4. Name the credential exactly: `theburgmusic-gcal`
5. Paste in the **Client ID** and **Client Secret** from Step 1
6. Click **Connect my account**
7. Sign in as `theburgmusic@gmail.com` when prompted — you may see a warning that the app
   isn't verified; click **Advanced** → **Go to StPeteMusic n8n (unsafe)** (this is safe,
   it's your own app in testing mode)
8. Grant the requested calendar permissions
9. Save

---

## Step 4 — Reconnect the workflow

After importing the updated `gcal-to-db-sync.json` workflow (or if the credential link breaks):

1. Open the `gcal-to-db-sync` workflow in n8n
2. Click the **Get Calendar Events** node
3. In the **Credential** dropdown, select `theburgmusic-gcal`
4. Save the workflow

---

## Step 5 — Test the sync

1. Open the `gcal-to-db-sync` workflow
2. Click **Test workflow** (plays all nodes from the trigger)
3. Verify the output of the **Upsert Event** node shows rows from multiple venues
4. Check the DB: `SELECT venue, COUNT(*) FROM events GROUP BY venue ORDER BY venue;`
   — you should see rows for `suite-e-studios`, `blueberry-patch`, etc.

---

## Adding a New Venue

1. Create (or get access to) the Google Calendar for the new venue
2. Share it with `theburgmusic@gmail.com` (Step 1 above)
3. Get the calendar ID from Google Calendar → Settings → scroll to **Integrate calendar**
4. Add one entry to the `VENUES` array at the top of the **Venue Config** Code node in n8n:
   ```js
   { slug: 'venue-slug', calendarId: 'the-calendar-id@group.calendar.google.com' }
   ```
5. Add one entry to `apps/web/src/lib/venues.ts` in the web app:
   ```ts
   'venue-slug': { name: 'Venue Display Name', color: '#HEXCOLOR', calendarId: '...' }
   ```
6. Run the sync manually to pull in the new calendar's events
