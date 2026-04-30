# WordPress Linktree Widget — Installation Guide

This guide explains how to add the Suite E Studios links widget to **suiteestudios.com**. The widget fetches live links from the StPeteMusic API and displays them automatically — no manual updates needed when Linktree changes.

---

## What You'll Need

- Admin access to suiteestudios.com (WordPress dashboard)
- The widget code: `apps/web/public/linktree-widget.html` in this repo  
  _(or copy the code block from the next section)_

---

## Step 1 — Copy the Widget Code

Open the file `apps/web/public/linktree-widget.html` in this repo and copy the entire contents.

Alternatively, find the latest version of the file at:
```
https://github.com/maylortaylor/StPeteMusic/blob/main/apps/web/public/linktree-widget.html
```

Click the **Raw** button, then select all (`Ctrl+A` / `Cmd+A`) and copy.

---

## Step 2 — Add the Widget to WordPress

Choose the method that matches how the page is built:

### Option A — Gutenberg (Block Editor) — Recommended

1. Go to **Pages** → open the page where you want to add the links
2. Click the **+** button to add a new block
3. Search for **Custom HTML** and select it
4. Paste the entire widget code into the block
5. Click **Preview** (eye icon) to see the result
6. Click **Update** / **Publish** to save

> The block will show as raw HTML in the editor — that's expected. Use Preview to see the rendered output.

### Option B — Classic Editor (Text tab)

1. Open the page in the Classic Editor
2. Click the **Text** tab (not Visual)
3. Place your cursor where you want the widget to appear
4. Paste the widget code
5. Switch back to **Visual** tab to preview
6. Click **Update** to save

### Option C — Elementor

1. Edit the page with Elementor
2. Search for the **HTML** widget in the left panel
3. Drag it onto the page in the desired location
4. Paste the widget code into the **HTML Code** field
5. Click **Update** to save

### Option D — Widget Area (Sidebar or Footer)

1. Go to **Appearance → Widgets**
2. Find the sidebar or footer zone where you want the links
3. Add a **Custom HTML** widget
4. Paste the widget code into the content field
5. Click **Save**

---

## Step 3 — Recommended Placement

The widget works best in one of these locations:

- **Below the hero/header section** — high visibility, catches visitors quickly
- **Dedicated "Links" or "Connect" section** — clear purpose
- **Footer** — always accessible on every page

Avoid placing it inside narrow sidebars (under ~400px) — the 2-column grid will collapse to single column but still looks clean.

---

## Step 4 — Apply Suite E Studios CSS Styling

The widget includes brand-matched styles by default (black cards, orange hover, Helvetica Neue, uppercase). No extra CSS is required.

If you want to adjust the look to better match the site (e.g. change font size, spacing, or colors), go to:

**Appearance → Customize → Additional CSS**

Paste any overrides there. Examples:

```css
/* Make cards slightly rounded */
.spm-link-card {
  border-radius: 4px;
}

/* Change hover color */
.spm-link-card:hover {
  background-color: #A43D00;
  border-color: #A43D00;
}

/* Adjust font size */
.spm-link-card {
  font-size: 0.875rem;
}

/* Limit widget width on wide screens */
#spm-links-widget {
  max-width: 600px;
}
```

---

## Step 5 — Test It

1. Open the page in a browser (not the editor preview — view the live page)
2. The widget should show **"Loading links…"** briefly, then display the Suite E Studios link cards
3. Open browser DevTools → **Network tab** — you should see a successful request to:
   ```
   https://qag1q0ijn5.execute-api.us-east-1.amazonaws.com/linktree
   ```
4. Click a card — it should open in a new tab at the correct URL
5. Resize to mobile width (~375px) — cards should stack to a single column

### If the widget shows blank / "Loading links…" stays forever

- Check the Network tab for a failed request (red row)
- Common cause: the page is on HTTP and the API uses HTTPS (mixed content block) — make sure suiteestudios.com is on HTTPS
- Check the Console tab for CORS or fetch errors and report them to Matt

---

## How It Works

- The widget calls the StPeteMusic API on page load
- It filters to the `suite_e_studios` profile and sorts links by their Linktree position
- When Linktree is updated, the widget automatically shows the new links on the next page load — no action needed

---

## Updating the Widget

The widget fetches live data, so **Linktree content updates automatically**.

If the widget's visual design needs to change (layout, colors, card style), Matt or Austen will update the file in the repo and provide a new code block to paste in.
