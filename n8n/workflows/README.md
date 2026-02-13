# n8n Workflows Directory

All n8n workflow files and supporting scripts for @StPeteMusic automation.

## 📋 Workflow Files

### Active / Recommended

| Workflow | Purpose | Status | Use For |
|----------|---------|--------|---------|
| **stpetemusic-post-manager.json** | Main post management interface | ✅ Active | Primary StPeteMusic content management |
| **notion-to-social-media-posting.json** | Multi-platform posting engine | 🔧 Phase 1 | Post to Instagram, Facebook, YouTube from Notion |
| **photo-video-optimizer.json** | Media optimization & conversion | ✅ Available | Resize/convert media for platform requirements |
| **ai-caption-metadata-generator.json** | AI-powered captions & metadata | ✅ Available | Generate captions using Claude/Gemini APIs |

### Reference / Archive

| Workflow | Purpose | Status | Notes |
|----------|---------|--------|-------|
| 9-social-media-platforms.json | Extended multi-platform support | 📚 Reference | Shows routing for 9 platforms (including TikTok, Twitter, etc.) |
| fully-automated-social-media-pipeline-v1.json | Legacy automation pipeline | 📦 Archive | Superseded by notion-to-social-media-posting.json |
| instagram-scraper-workflow.json | Scrape Instagram posts | 📚 Reference | For historical data collection / analytics |
| posting-workflow.json | Basic posting template | 📚 Reference | Simple single-platform posting example |
| master-workflow-validator-ai-caption-generator-instagram-scraper.json | Composite example workflow | 📚 Reference | Demonstrates validator + scraper + generator pattern |

## 🚀 Getting Started

### Prerequisites
- n8n running (via Docker): `cd .. && docker-compose up -d`
- Environment variables configured: See `../.env` and `../.env.example`
- API credentials set up for platforms you want to use

### Import a Workflow

1. Open n8n UI at http://localhost:5678
2. Click **Workflows** → **Import from file**
3. Select desired `.json` file from this directory
4. Configure any missing credentials in n8n UI
5. Test with sample data before deploying

### Phase 1: Multi-Platform Posting Setup

To set up Instagram + Facebook + YouTube posting:

1. **Import workflow**
   - Import `Notion_to_Social_Media_Posting.json`

2. **Configure API credentials in n8n**
   - Instagram: Add credentials using `IG_USER_ID` and `IG_ACCESS_TOKEN` from `.env`
   - Facebook: Add credentials using `FB_PAGE_ID` and `FB_ACCESS_TOKEN` from `.env`
   - YouTube: Add OAuth2 Google credentials (configure in n8n UI)

3. **Set up Notion database** (if not already done)
   - Create database with fields: Post Title, Caption, Platform, Media Type, Media Link, Status
   - Add test post with Status: "Scheduled"

4. **Test the workflow**
   - Run workflow manually in n8n
   - Verify post appears on platform(s)
   - Check Notion Status updated to "Posted"

See `../README.md` for detailed setup instructions and troubleshooting.

## 🔧 Helper Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **findMediaFiles.js** | Locate and validate media files | `node findMediaFiles.js /path/to/media` |

## 📝 Workflow Details

### stpetemusic-post-manager.json

**What it does:**
- Main workflow for managing @StPeteMusic posts
- Serves as the central hub for post creation and scheduling
- Integrates with supporting workflows (optimization, caption generation)

**Triggers:**
- Manual trigger from n8n UI
- Optional: Webhook triggers for external integrations

**Output:**
- Posts scheduled in queue
- Integration with Instagram Scraper for style reference

### Notion_to_Social_Media_Posting.json

**What it does:**
- Queries Notion database for posts marked "Scheduled"
- Routes posts to Instagram, Facebook, or YouTube based on platform selection
- Handles media uploading and caption publishing
- Updates Notion status on success/failure

**Platform Support:**
- **Instagram:** Business accounts, image + video support, captions up to 2,200 chars
- **Facebook:** Any page type, image + video support, full captions
- **YouTube:** Public/unlisted videos, 6 videos/day quota, OAuth2 auth

**Trigger:**
- Manual (from n8n UI) or scheduled (future)

**Failure Handling:**
- Updates Notion Status to "Error" with error message
- Logs details in n8n execution history

### Photo_Video_Optimizer.json

**What it does:**
- Resizes images/videos for platform specifications
- Converts between formats (e.g., MP4, WebM, etc.)
- Optimizes file sizes for faster uploads
- Validates media before posting

**Input:**
- Media URL or file path
- Target platform
- Optional: Custom dimensions

**Output:**
- Optimized media file
- Metadata (dimensions, file size, format)

### AI_Caption_Generator.json

**What it does:**
- Generates captions using Claude or Gemini AI
- Extracts hashtags and relevant keywords
- Adapts tone for platform (Instagram, Facebook, YouTube)
- Uses past post context for style consistency

**Input:**
- Post title/description
- Platform target
- Optional: Past posts for context

**Output:**
- AI-generated caption
- Suggested hashtags
- Character count for each platform

## 🔐 Environment Variables

These workflows use environment variables from `../.env`:

```bash
# n8n Configuration
N8N_API_KEY=your_n8n_api_key

# Instagram Business API
IG_USER_ID=your_instagram_business_account_id
IG_ACCESS_TOKEN=your_instagram_long_lived_access_token

# Facebook Page API
FB_PAGE_ID=your_facebook_page_id
FB_ACCESS_TOKEN=your_facebook_page_access_token

# AI APIs (for caption generation)
CLAUDE_API_KEY_N8N_STPETEMUSIC=your_claude_api_key
N8N_GEMINI_API_KEY=your_gemini_api_key

# YouTube (configured in n8n Credentials, optional)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

See `../.env.example` for complete list.

## 🧪 Testing Workflows

### Test Checklist

Before running workflows in production:

- [ ] All API credentials configured in `.env`
- [ ] Workflow imported into n8n
- [ ] Test data created in Notion (if using Notion_to_Social_Media_Posting)
- [ ] Workflow executed manually from n8n UI
- [ ] Output verified on target platform(s)
- [ ] Status/metadata updated correctly
- [ ] Error handling tested (invalid URL, expired token, etc.)

### Common Test Cases

1. **Single image post**
   - Create Notion entry with image URL
   - Run workflow
   - Verify on Instagram + Facebook

2. **Video post (1080×1920)**
   - Create Notion entry with video URL
   - Run optimizer first (if needed)
   - Run workflow
   - Verify on Instagram (Reel) + Facebook + YouTube (Short)

3. **Text-only post**
   - Create Notion entry with no media
   - Run workflow
   - Verify on Facebook only

4. **Error handling**
   - Test with invalid URL
   - Test with expired token
   - Verify Notion Status updates to "Error"
   - Verify error message captured

## 🐛 Troubleshooting

### Common Issues

**"Invalid Media URL"**
- Media URL must be publicly accessible
- Cannot use Notion-hosted images (server-relative URLs)
- Test URL in web browser first
- Check for CORS issues if cross-origin

**"Access Token Expired"**
- Instagram/Facebook tokens expire in 60 days
- YouTube tokens expire in 30 days
- Regenerate tokens and update `.env`
- Restart n8n: `docker-compose restart`

**"Quota Exceeded"** (YouTube)
- YouTube allows 6 videos/day
- Quota resets daily at midnight UTC
- Use test videos sparingly during setup

**"Platform not found"**
- Check Platform field value matches exactly: "Instagram", "Facebook", or "YouTube"
- Values are case-sensitive!

**Workflow won't run**
- Check n8n is running: `docker ps | grep n8n`
- Verify credentials are configured in n8n UI
- Check execution logs in n8n for detailed error messages

### Debug Steps

1. Open n8n UI → Workflows → Select workflow
2. Click "Executions" tab to view execution history
3. Click on failed execution to see error details
4. Verify credentials in n8n Credentials section
5. Test API credentials manually with curl commands
6. Check platform API documentation for error codes

## 📚 Additional Resources

- **n8n Documentation:** https://docs.n8n.io/
- **Meta Graph API (Instagram/Facebook):** https://developers.facebook.com/docs/graph-api/
- **YouTube Data API:** https://developers.google.com/youtube/v3/
- **Notion API:** https://developers.notion.com/

## 📋 Workflow Import Order (Phase 1)

For best results, set up workflows in this order:

1. **notion-to-social-media-posting.json** - Main workflow
2. **photo-video-optimizer.json** - For media optimization
3. **ai-caption-metadata-generator.json** - For AI captions
4. **stpetemusic-post-manager.json** - Post management hub (optional)

## 🔄 Workflow Execution Flow

```
Notion Database (Status: "Scheduled")
    ↓
[Notion_to_Social_Media_Posting.json]
    ├─ [Photo_Video_Optimizer.json] (optional)
    ├─ [AI_Caption_Generator.json] (optional)
    ↓
[Platform Router]
    ├─→ Instagram API
    ├─→ Facebook API
    └─→ YouTube API
    ↓
[Update Notion Status]
    ├─→ "Posted" (success)
    └─→ "Error" (failure)
```

---

**Last Updated:** February 12, 2026
**Status:** Phase 1 - Multi-Platform Posting Setup
**Maintained By:** Matt Taylor
