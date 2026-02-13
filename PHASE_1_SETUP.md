# Phase 1: Multi-Platform Social Media Posting Setup

**Goal:** Connect Instagram, Facebook, and YouTube to n8n to post from a single Notion database.

**Status:** 🚧 In Progress - Ready to implement

---

## 📋 Pre-Implementation Checklist

Before starting Phase 1, ensure:

- [ ] Docker is installed and running
- [ ] You have access to Instagram Business account (or can convert personal account)
- [ ] You have a Facebook Page connected to Instagram
- [ ] You have a Google Cloud project (for YouTube API)
- [ ] Meta Developer account created
- [ ] Google Cloud Console access

---

## 🎯 Phase 1 Objectives

### Post Type Support

| Post Type | Instagram | Facebook | YouTube | Notes |
|-----------|-----------|----------|---------|-------|
| **Text Only** | ❌ No | ✅ Yes | ❌ No | Text-only posts go to Facebook only |
| **Single Image** | ✅ Yes | ✅ Yes | ❌ No | Standard image post |
| **Multiple Images** | ✅ Carousel | ✅ Carousel | ❌ No | Multi-pic carousel |
| **Video (1080×1920)** | ✅ Reel | ✅ Video | ✅ Short | Instagram Reels, FB video, YouTube Shorts |

### Expected Workflow

```
1. Create post in Notion with Status: "Scheduled"
2. Manually trigger Notion_to_Social_Media_Posting workflow in n8n
3. Workflow routes to correct platform(s) based on post type
4. Media uploaded, captions applied
5. Notion Status updates to "Posted" + URL links to posts
6. (Optional) Set up scheduler for automatic daily execution
```

---

## 🔧 Setup Steps

### Step 1: Environment Configuration (15 mins)

1. Copy credentials to `.env` file
   ```bash
   cd /Users/matttaylor/Documents/_dev/maylortaylor/StPeteMusic
   # Edit .env with your actual API credentials
   ```

2. Required environment variables:
   ```bash
   N8N_API_KEY=your_key_here
   IG_USER_ID=your_ig_business_id
   IG_ACCESS_TOKEN=your_ig_token
   FB_PAGE_ID=your_page_id
   FB_ACCESS_TOKEN=your_fb_token
   CLAUDE_API_KEY_N8N_STPETEMUSIC=your_claude_key
   N8N_GEMINI_API_KEY=your_gemini_key
   ```

   See `.env.example` for complete list.

### Step 2: Start n8n (5 mins)

```bash
cd n8n
docker-compose up -d
```

Access at: http://localhost:5678

### Step 3: Import Workflows (10 mins)

1. Open n8n UI
2. Click **Workflows** → **Import from file**
3. Import these in order:
   - `notion-to-social-media-posting.json` (main workflow)
   - `Photo_Video_Optimizer.json` (optional - for media optimization)
   - `AI_Caption_Generator.json` (optional - for AI captions)

### Step 4: Configure Credentials in n8n (20 mins)

#### Instagram

1. Create new credential: **Type** → Facebook Graph API
2. Fields:
   - **App ID**: Your Meta app ID
   - **App Secret**: Your Meta app secret
   - **Access Token**: Long-lived Instagram token
3. Test connection

#### Facebook

1. Create new credential: **Type** → Facebook Graph API
2. Fields:
   - **App ID**: Your Meta app ID
   - **App Secret**: Your Meta app secret
   - **Access Token**: Page access token
3. Test connection

#### YouTube (Optional for Phase 1, but needed for video posts)

1. Create new credential: **Type** → Google OAuth2
2. Follow Google authentication flow
3. Grant YouTube upload permissions

### Step 5: Set Up Notion Database (10 mins)

If not already set up, create a Notion database with these fields:

| Field | Type | Purpose |
|-------|------|---------|
| Post Title | Title | Post identifier |
| Caption | Rich Text | Main post content |
| Platform | Select | "Instagram" / "Facebook" / "YouTube" |
| Media Type | Select | "Image" / "Video" / "None" (for text-only) |
| Media Link | URL | Public URL to media |
| Hashtags | Rich Text | e.g., #StPeteMusic #Music |
| Status | Select | "Scheduled" / "Posted" / "Error" / "Draft" |
| Posted Date | Date | Auto-filled on posting |
| Post URL | URL | Link to published post (auto-filled) |
| Error Message | Text | If posting failed |

### Step 6: Test the Workflow (30 mins)

#### Test 1: Single Image Post

1. Create test post in Notion:
   - Platform: "Instagram"
   - Media Type: "Image"
   - Media Link: Public image URL
   - Status: "Scheduled"

2. Run workflow manually in n8n

3. Verify:
   - [ ] Post appears on Instagram
   - [ ] Notion Status updated to "Posted"
   - [ ] Post URL populated

#### Test 2: Text-Only Post (Facebook)

1. Create test post in Notion:
   - Platform: "Facebook"
   - Media Type: "None"
   - Status: "Scheduled"

2. Run workflow manually

3. Verify:
   - [ ] Post appears on Facebook
   - [ ] Only on Facebook (not Instagram)

#### Test 3: Video Post (All Platforms)

1. Create test post in Notion:
   - Platform: "All" (or run separately for each)
   - Media Type: "Video"
   - Media Link: MP4 video (1080×1920 preferred)
   - Status: "Scheduled"

2. Run workflow manually

3. Verify:
   - [ ] Video appears as Reel on Instagram
   - [ ] Video appears on Facebook
   - [ ] Video appears as Short on YouTube

#### Test 4: Error Handling

1. Create test post with invalid URL

2. Run workflow

3. Verify:
   - [ ] Notion Status updated to "Error"
   - [ ] Error message captured
   - [ ] Workflow doesn't crash

---

## 🚀 Successful Completion

Phase 1 is complete when:

- ✅ Text-only posts post to Facebook only
- ✅ Single image posts post to Instagram + Facebook
- ✅ Multi-image carousels post to both platforms
- ✅ Video posts (1080×1920) post to Instagram Reels + Facebook + YouTube Shorts
- ✅ Hashtags and mentions are included
- ✅ Notion database status updates on success/failure
- ✅ Posted URLs are captured and linked
- ✅ Error messages are logged for troubleshooting

---

## 🔑 API Credentials Setup

### Instagram Business Account

1. Go to instagram.com → Settings
2. Switch to Business Account
3. Connect to Facebook Page
4. Get Account ID: Settings → Account → Account ID

### Meta Developer App

1. Go to developers.facebook.com
2. Create new app (type: Business)
3. Add "Instagram Graph API" product
4. Get credentials:
   - App ID
   - App Secret
   - Create long-lived user token (60-day expiry)

### Facebook Page Token

1. Graph API Explorer: developers.facebook.com/tools/explorer
2. App: Your Meta app
3. Get access token for your page
4. Copy Page Access Token (starts with "EAA...")

### YouTube Data API

1. Go to console.cloud.google.com
2. Create new project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credential (Desktop/Web app)
5. Download credentials.json

---

## 📝 Troubleshooting

### API Connection Issues

**"Invalid credentials"**
- Verify tokens are not expired (Instagram/Facebook: 60 days)
- Check App ID and Secret match in Meta dashboard
- Ensure Page Access Token is for correct page

**"Access Denied"**
- Ensure Instagram account is Business type
- Verify Facebook Page is connected to Instagram
- Check app permissions in Meta dashboard

### Media Issues

**"Invalid Media URL"**
- URL must be publicly accessible
- Test URL in browser
- Cannot use Notion-hosted images

**"Unsupported Media Format"**
- Instagram: JPG, PNG
- Video: MP4 (H.264 codec)
- YouTube: MP4, MOV, AVI, WMV

### Quota Issues

**YouTube "Quota Exceeded"**
- YouTube limit: 6 videos/day
- Quota resets at midnight UTC
- Use fewer test videos during setup

---

## 📞 Quick Reference

### Start/Stop n8n

```bash
# Start
cd n8n && docker-compose up -d

# Stop
cd n8n && docker-compose down

# View logs
docker logs -f n8n
```

### Check Token Validity

```bash
# Instagram
curl "https://graph.facebook.com/v16.0/$IG_USER_ID?fields=id,username&access_token=$IG_ACCESS_TOKEN"

# Facebook
curl "https://graph.facebook.com/v16.0/$FB_PAGE_ID?fields=id,name&access_token=$FB_ACCESS_TOKEN"
```

### n8n Documentation

- Workflows: http://localhost:5678/workflows
- Executions: http://localhost:5678/executions
- Credentials: http://localhost:5678/credentials

---

## 📅 Timeline Estimate

- **Day 1:** Environment setup + API credential gathering (2-4 hours)
- **Day 2:** Workflow import + Notion setup + testing (2-3 hours)
- **Day 3:** Refinement + error handling + production readiness (1-2 hours)

**Total:** 5-9 hours of work

---

## ✨ Next Steps After Phase 1

Once Phase 1 is working:

1. **Set up scheduler** - Automatically post at specific times
2. **Add content calendar** - Notion calendar view for planning
3. **Implement approval workflow** - Draft → Approve → Post
4. **Add analytics** - Track post performance
5. **Move to Phase 2** - Enhanced features and multiple accounts

---

**Created:** February 12, 2026
**Phase 1 Status:** Ready for Implementation
**Maintained By:** Matt Taylor
