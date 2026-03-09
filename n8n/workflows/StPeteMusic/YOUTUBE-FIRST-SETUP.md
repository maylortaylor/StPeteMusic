# N8N + YouTube + Claude Pro Setup Guide

Simplified setup focused on YouTube posting only, using Claude Pro instead of OpenAI API.

---

## ⚡ Quick Summary

Instead of OpenAI API ($$$), we'll use Claude Pro via Anthropic API or Grok/Gemini as fallback. We'll set up posting to YouTube first, skip IG/FB for now (work laptop restrictions).

**What you need:**
- Claude Pro account (or Grok/Gemini API)
- YouTube API credentials
- Obsidian Local REST API key (already have)
- N8N running locally

---

## 🔑 Step 1: Get Claude Pro API Access

### Option A: Claude Pro + Anthropic API (Recommended)

1. Go to https://console.anthropic.com
2. Sign in with your Claude Pro account
3. Create API key in Console
4. Copy the key somewhere safe

**Note**: Claude Pro subscription gives you access to Claude Sonnet/Opus models via API.

### Option B: Fallback to Grok

If Claude Pro API doesn't work:
1. Go to https://console.x.ai
2. Sign up for Grok API
3. Get API key
4. Use in N8N

### Option C: Fallback to Google Gemini

If Grok unavailable:
1. Go to https://ai.google.dev
2. Get Gemini API key
3. Use in N8N

---

## 🎬 Step 2: Get YouTube API Credentials

### Create Google OAuth2 Credentials

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create **OAuth 2.0 Desktop Application** credentials
   - Application type: Desktop app
   - Authorized redirect URIs: `http://localhost:5678/rest/oauth2-callback` (for N8N)
5. Download the JSON credentials file
6. Save securely

**Note**: You'll use this to upload videos to your @StPeteMusic YouTube account.

---

## 🔧 Step 3: Configure N8N Credentials

### A. Claude Pro (Anthropic) Credentials

1. Open N8N: http://localhost:5678
2. Go to **Credentials** → **Create New**
3. Search for **Anthropic Chat** (or create **HTTP Header Auth** if not available)
4. Set:
   - **API Key**: Your Claude API key from Step 1
   - **Name**: `Claude Pro API`
5. Save

### B. YouTube OAuth2

1. In N8N, go to **Credentials** → **Create New**
2. Select **Google OAuth2**
3. Set:
   - **Client ID**: From your Google Cloud credentials JSON
   - **Client Secret**: From your Google Cloud credentials JSON
   - **Scope**: `youtube.upload` (and `youtube`)
   - **Redirect URL**: `http://localhost:5678/rest/oauth2-callback`
4. Name: `YouTube API`
5. Save and authorize

### C. Obsidian Local REST API

1. In N8N, go to **Credentials** → **Create New**
2. Select **HTTP Header Auth**
3. Set:
   - **Header name**: `Authorization`
   - **Header value**: `Bearer [YOUR_OBSIDIAN_API_KEY]`
4. Name: `Obsidian API`
5. Save

---

## 🎬 Step 4: Import & Configure Post Creator Workflow

1. Open N8N Dashboard
2. Click **Workflows** → **Import**
3. Upload `obsidian-post-creator.json`
4. Open the workflow
5. Update these nodes:

### Update "OpenAI Chat Model" Node

- **Delete this node** (or disable it)
- Replace with new **Anthropic Chat** node:
  - Use `Claude Pro API` credentials
  - Model: `claude-3-5-sonnet-20241022` (or latest)
  - Max tokens: 2000

### Update "Read Obsidian Posts" Node

- Use `Obsidian API` credentials
- URL: `http://localhost:27123/vault/`

### Update "Write to Obsidian" Node

- Use `Obsidian API` credentials
- URL: `http://localhost:27123/vault/create`

6. **Save** workflow

---

## 🎬 Step 5: Import & Configure YouTube Posting Workflow

1. Open N8N Dashboard
2. Click **Workflows** → **Import**
3. Upload `obsidian-to-social-media-posting.json`
4. Open the workflow
5. **Delete or disable** these nodes (IG/FB not needed):
   - `Post to Instagram`
   - `Post to Facebook`
   - Any connections to them

6. Update "Post to YouTube" node:
   - Use `YouTube API` credentials
   - Method: POST
   - URL: `https://www.googleapis.com/youtube/v3/videos?part=snippet,status`

7. Update Platform Router:
   - Only route to YouTube (delete other outputs)

8. **Save** workflow

---

## ✅ Step 6: Test the Setup

### Test Post Creator

1. Open `obsidian-post-creator.json` workflow
2. Click **Test** or **Listen for chat**
3. Send a test message:
   ```
   Create a YouTube post for a band called "Test Band" performing at Suite E on 03.27
   Keep it short and engaging
   ```
4. Wait for response
5. Check `🎵 StPeteMusic/Content/Drafts/` in Obsidian
6. Verify a markdown file was created with the post

**If it works**: ✅ Claude Pro + Obsidian integration is working

### Test YouTube Posting

1. Create a test post in `🎵 StPeteMusic/Content/Drafts/`
2. Use this frontmatter:
   ```yaml
   ---
   title: "Test YouTube Post"
   status: ready
   platform: YT
   publish-date: 2026-03-10
   caption: "Test video title"
   media-link: "https://example.com/video.mp4"
   youtube-playlist: "https://www.youtube.com/watch?v=..."
   ---
   ```
3. Open `obsidian-to-social-media-posting.json`
4. Click **Execute** (Manual Trigger)
5. Monitor execution
6. Check YouTube account for draft video

**If it works**: ✅ YouTube API integration is working

---

## 🚀 Usage Going Forward

### Create Posts via Chat

1. Open Post Creator workflow
2. Message: "Create YouTube posts for Final Friday March 27 with Earth Girl, CHRISS, and Ava Iri"
3. AI generates posts and saves to Drafts
4. Review posts in Obsidian

### Publish to YouTube

1. Edit draft posts (add media link if needed)
2. Set `status: ready`
3. Workflow posts to YouTube every 4 hours (or manually trigger)

---

## 🐛 Troubleshooting

### Claude API not responding
- Verify API key is correct
- Check your Anthropic account has credits/active subscription
- Try Grok or Gemini fallback

### YouTube API errors
- Verify OAuth2 credentials are correct
- Make sure YouTube API is enabled in Google Cloud
- Check redirect URL matches exactly

### Obsidian posts not saving
- Verify Local REST API is running
- Check API key is correct
- Verify vault path: `🎵 StPeteMusic/Content/Drafts/`

### No credentials found in N8N
- Go to Credentials → refresh browser
- Create credential again
- Restart N8N if needed

---

## 📝 Next Steps

**Once YouTube is working:**
1. ✅ Create & test a few posts
2. ✅ Refine AI prompts if needed
3. ✅ Build up a backlog of posts in Drafts
4. ✅ Monitor YouTube channel growth
5. ⏭️ (Later) Add IG/FB when you have laptop without restrictions

---

## 📚 System Prompt

Your AI prompt templates are in:
- `🤖 AI-Prompts/event-announcement-template.md`
- `🤖 AI-Prompts/band-spotlight-template.md`

These guide the AI on tone, format, and required elements. Modify these to change how posts are generated.

---

## Questions?

- Anthropic Console: https://console.anthropic.com
- Google Cloud Console: https://console.cloud.google.com
- N8N Docs: https://docs.n8n.io

