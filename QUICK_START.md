# Quick Start Guide

Get @StPeteMusic automation running in 5 minutes.

## 1️⃣ Configure Credentials (3 mins)

```bash
# Copy template
cp .env.example .env

# Edit with your actual credentials
nano .env
# or: open -t .env (macOS)

# Required:
# - N8N_API_KEY
# - IG_USER_ID, IG_ACCESS_TOKEN (for Instagram)
# - FB_PAGE_ID, FB_ACCESS_TOKEN (for Facebook)
# - YouTube credentials (for video posts)
```

## 2️⃣ Start n8n (2 mins)

```bash
cd n8n
docker-compose up -d

# Wait 30 seconds for n8n to start
sleep 30

# Access at: http://localhost:5678
```

## 3️⃣ Import Workflows (2 mins)

1. Open http://localhost:5678
2. **Workflows** → **Import from file**
3. Select: `n8n/workflows/notion-to-social-media-posting.json`
4. Click "Import" and wait for confirmation

## 4️⃣ Test It

Create test post in Notion:
- **Platform:** "Instagram"
- **Media Type:** "Image"
- **Media Link:** (public image URL)
- **Status:** "Scheduled"

In n8n, click the **Execute** button and watch it work!

---

## 📚 Need More Info?

- **Full Setup:** See `PHASE_1_SETUP.md`
- **Project Overview:** See `README.md`
- **Workflow Details:** See `n8n/workflows/README.md`
- **Troubleshooting:** See `README.md` → Troubleshooting section

## 🛑 Stop n8n

```bash
cd n8n
docker-compose down
```

---

**That's it! You're ready to go.** 🚀
