# StPeteMusic Project Repository

**Purpose:** Centralized hub for all @StPeteMusic brand tools, automation, and infrastructure. This repository houses n8n workflows, frontend applications, and supporting tools for managing social media, events, and community engagement in St. Petersburg, FL.

---

## 📁 Project Structure

### Current Directories

```
/
├── README.md                      # This file - project overview and roadmap
├── CLAUDE.md                      # Guidance for Claude Code assistance
├── .env.example                   # Template for environment variables
├── .env                           # Local environment variables (DO NOT COMMIT)
├── .gitignore                     # Git ignore rules
│
├── n8n/                           # n8n workflow automation engine
│   ├── docker-compose.yaml        # n8n Docker setup
│   ├── .env                       # n8n-specific environment variables
│   ├── workflows/                 # All n8n workflows and associated files
│   │   ├── stpetemusic-post-manager.json       # Main post management workflow
│   │   ├── Notion_to_Social_Media_Posting.json # Multi-platform posting workflow
│   │   ├── Photo_Video_Optimizer.json          # Media optimization
│   │   ├── AI_Caption_Generator.json           # AI caption generation
│   │   └── ... (other workflow files)
│   └── scripts/                   # Helper scripts
│       └── findMediaFiles.js      # Media file location utility
│
├── data/                          # Data archives and backups
│   └── stpetemusic-instagram-data/  # Instagram data export
│
├── docs/                          # Project documentation
│   └── project-instructions.md    # Project guidelines
│
└── apps/                          # Future: Frontend applications
    ├── dashboard/                 # (Future) Admin dashboard
    ├── social-manager/            # (Future) Social media management UI
    └── event-manager/             # (Future) Event management system
```

---

## 🎯 Current Features (MVP - Phase 0)

### n8n Workflows
- ✅ **stpetemusic-post-manager.json** - Core workflow for managing post scheduling
- ✅ **Notion_to_Social_Media_Posting.json** - Cross-platform posting framework
- ✅ **Photo_Video_Optimizer.json** - Media optimization and format conversion
- ✅ **AI_Caption_Generator.json** - AI-powered caption and metadata generation
- ✅ Helper scripts and configuration files

### Infrastructure
- ✅ n8n Docker setup (local development)
- ✅ Environment configuration system
- ✅ Data export/backup structure

---

## 🚀 Project Roadmap

### Phase 1: Multi-Platform Social Media Posting (In Progress)
**Goal:** Create unified workflow to post to Instagram, Facebook, and YouTube from a single interface.

**Features:**
- [ ] Text-only posts → Facebook
- [ ] Single image posts → Instagram + Facebook
- [ ] Multi-image carousel posts → Instagram + Facebook
- [ ] Video posts (1080w × 1920h) → Instagram Reels + YouTube Shorts + Facebook
- [ ] Hashtag and mention support
- [ ] Caption/description management
- [ ] Posted metadata tracking

**Technical:**
- [ ] Complete `Notion_to_Social_Media_Posting.json` workflow
- [ ] API credential setup for all 3 platforms
- [ ] Error handling and retry logic
- [ ] Success/failure status tracking
- [ ] Media URL validation

**Definition of Done:**
- Workflow successfully posts to all 3 platforms with single trigger
- Notion database updates with post status
- All media types supported
- Error handling tested

---

### Phase 2: Enhanced Workflow Features
**Goal:** Expand capabilities with scheduling, content management, and analytics.

**Features:**
- [ ] Scheduled posting (queue posts for future dates)
- [ ] Content calendar view (integration with Notion or Google Calendar)
- [ ] Post drafts and approval workflow
- [ ] Multi-account support (Suite E Studios, Final Friday, etc.)
- [ ] Hashtag suggestions and trending topic integration
- [ ] Basic analytics integration (engagement metrics)
- [ ] Cross-platform scheduling synchronization
- [ ] Bulk upload/scheduling from CSV

**Technical:**
- [ ] Scheduler triggers for time-based posting
- [ ] Notion database enhancements
- [ ] Analytics node integration
- [ ] Batch processing improvements
- [ ] Webhook integration for external triggers

---

### Phase 3: Google Drive Integration & Media Management
**Goal:** Streamline media asset management and organization.

**Features:**
- [ ] Google Drive folder structure for media assets
- [ ] Automatic media organization (by event, date, type)
- [ ] Drag-and-drop media assignment in Notion
- [ ] Automatic thumbnail generation
- [ ] Media library search and tagging
- [ ] Rights/licensing metadata tracking
- [ ] Auto-resize for platform requirements
- [ ] Google Sheets integration for analytics reports

**Technical:**
- [ ] Google Drive API integration
- [ ] File monitoring and automation
- [ ] Metadata extraction and tagging
- [ ] Image/video processing pipeline
- [ ] Report generation workflows

---

### Future Phases (4+)
**Potential expansions:**
- [ ] React dashboard for workflow management UI
- [ ] Event management integration (EventBrite API)
- [ ] Email notification system
- [ ] DM/comment monitoring and response
- [ ] TikTok/Twitter/LinkedIn integration
- [ ] AI-powered image generation
- [ ] Live streaming automation
- [ ] Database backup and recovery workflows

---

## 🛠️ Setup & Getting Started

### Prerequisites

1. **Docker & Docker Compose** - For running n8n
2. **API Credentials** (see `.env.example` for full list):
   - n8n API key
   - Instagram Business account + Meta Developer app credentials
   - Facebook Page + access tokens
   - Google/YouTube credentials (optional for Phase 1)
   - Claude API key (for AI features)
   - Gemini API key (for captions)

### Initial Setup

1. **Clone repository**
   ```bash
   cd /Users/matttaylor/Documents/_dev/maylortaylor/StPeteMusic
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Start n8n**
   ```bash
   cd n8n
   docker-compose up -d
   # n8n available at http://localhost:5678
   ```

4. **Import workflows**
   - Open n8n UI
   - Workflows → "Import from file"
   - Select workflow JSON files from `/n8n/workflows/`

5. **Configure credentials in n8n**
   - Add Instagram/Facebook/YouTube credentials in n8n UI
   - Reference environment variables in workflow nodes

### Stopping n8n

```bash
cd n8n
docker-compose down
```

---

## 📝 Workflow Files

### Core Workflows

| Workflow | Purpose | Status | Notes |
|----------|---------|--------|-------|
| **stpetemusic-post-manager.json** | Main post management interface | Active | Primary workflow for StPeteMusic posts |
| **notion-to-social-media-posting.json** | Multi-platform posting engine | In Development | Routes posts to IG/FB/YouTube |
| **photo-video-optimizer.json** | Media optimization | Available | Resizes/converts media for platforms |
| **ai-caption-metadata-generator.json** | AI caption generation | Available | Uses Claude/Gemini for smart captions |
| 9-social-media-platforms.json | Expanded platform support | Legacy | Reference for multi-platform routing |
| fully-automated-social-media-pipeline-v1.json | Legacy pipeline | Archive | Deprecated - use notion workflow instead |
| instagram-scraper-workflow.json | Scrape IG posts | Reference | For historical data collection |
| posting-workflow.json | Basic posting template | Legacy | Replaced by notion workflow |
| master-workflow-validator-ai-caption-generator-instagram-scraper.json | Composite workflow | Archive | Example of validator + scraper + generator |

### Helper Scripts

| Script | Purpose |
|--------|---------|
| findMediaFiles.js | Locate and validate media files for posting |

---

## 🔐 Security & Environment Variables

### Important Notes

⚠️ **NEVER commit `.env` file to git** - contains sensitive API keys and tokens

**Required Variables:**
- `N8N_API_KEY` - n8n internal API key
- `IG_USER_ID`, `IG_ACCESS_TOKEN` - Instagram Business API
- `FB_PAGE_ID`, `FB_ACCESS_TOKEN` - Facebook Page API
- `CLAUDE_API_KEY_N8N_STPETEMUSIC` - Claude API for AI features
- `N8N_GEMINI_API_KEY` - Google Gemini for captions

**Token Expiration:**
- Instagram/Facebook tokens: 60 days
- YouTube tokens: 30 days
- Monitor and refresh before expiration

See [Token Refresh Guide](#token-refresh-guide) below.

---

## 🔄 Token Refresh Guide

### Instagram/Facebook (60-day expiration)

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_refresh_token&access_token=YOUR_TOKEN"
```
Update `IG_ACCESS_TOKEN` in `.env` and restart n8n.

### YouTube (30-day expiration)

1. Open n8n UI → Credentials
2. Find YouTube credential → "Reconnect with Google"
3. Re-authenticate with Google account

---

## 📊 Database Schema (Notion Integration)

For Phase 1, the Notion database structure is:

| Field | Type | Purpose |
|-------|------|---------|
| Post Title | Text/Title | Post name/identifier |
| Caption/Post Text | Rich Text | Main post content |
| Platform | Select | Target platform(s): Instagram, Facebook, YouTube |
| Media Type | Select | Image, Video, or Text-only |
| Media Link | URL | Public URL to media file |
| Hashtags | Rich Text | Hashtags to include |
| Mentions/Tags | Rich Text | @handles to tag |
| Status | Select | Scheduled / Posted / Error / Draft |
| Posted Date | Date | When post was published |
| Post URL | URL | Link to published post |
| Error Message | Text | Error details if posting failed |

---

## 🧪 Testing Workflows

### Test Checklist

Before deploying a workflow to production:

- [ ] All API credentials configured in `.env`
- [ ] Workflow imported into n8n
- [ ] Test data created in Notion (Status: "Scheduled")
- [ ] Workflow executed manually
- [ ] Post verified on platform(s)
- [ ] Notion status updated to "Posted"
- [ ] Error handling tested (invalid URL, expired token)

### Common Test Cases

1. **Single image post** → Should appear on IG + FB
2. **Video post (1080×1920)** → IG Reel + YouTube Short + FB video
3. **Text-only post** → Facebook only
4. **Expired token** → Graceful error, Notion status = "Error"
5. **Invalid media URL** → Validation fails, Notion status = "Error"

---

## 🐛 Troubleshooting

### Workflow Execution Issues

**"Invalid Media URL"**
- Media URL must be publicly accessible
- Cannot use Notion-hosted images
- Test URL in web browser first

**"Access Token Expired"**
- Instagram/Facebook: Regenerate and update `.env`
- YouTube: Re-authenticate in n8n Credentials
- Restart n8n after updating tokens

**"Platform not found"**
- Platform field must match exactly: "Instagram", "Facebook", or "YouTube"
- Case-sensitive!

**"Quota Exceeded" (YouTube)**
- YouTube allows 6 videos/day
- Quota resets daily at midnight UTC
- Wait 24 hours or request quota increase from Google Cloud

### n8n Connection Issues

**"Cannot connect to n8n"**
- Verify `docker-compose up -d` is running: `docker ps | grep n8n`
- Check port 5678 is available: `lsof -i :5678`
- Review Docker logs: `docker logs n8n_container_name`

**"Environment variables not loading"**
- Verify `.env` file exists in project root
- Restart n8n after updating `.env`: `docker-compose restart`
- Check variable names match workflow references

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | This file - project overview and setup |
| `CLAUDE.md` | Claude Code guidance and project context |
| `.env.example` | Template for environment variables |
| `n8n/workflows/` | All workflow documentation |
| `docs/project-instructions.md` | Additional project guidelines |

---

## 🎵 Brand Information

**@StPeteMusic** is a community music promoter in St. Petersburg, FL focusing on:
- Live music events and artist support
- Community engagement through events like "Final Friday" (monthly)
- Venue management (Suite E Studios)
- Collaboration with local artists and community

**Key Platforms:**
- Instagram: https://www.instagram.com/StPeteMusic
- Facebook: https://www.facebook.com/StPeteFLMusic
- YouTube: https://youtube.com/@StPeteMusic
- EventBrite: https://www.eventbrite.com/o/st-pete-music-105663485881

---

## 🤝 Contributing

When adding new workflows or features:

1. Create workflow in n8n UI
2. Test thoroughly with sample data
3. Export workflow as JSON: Workflows → ... → Download
4. Place in `/n8n/workflows/` with descriptive name
5. Update this README with workflow description
6. Update `.env.example` if new credentials needed
7. Commit with descriptive message

---

## 📞 Support & Contact

For issues with:
- **Workflows** - Check n8n execution logs and troubleshooting section above
- **API Credentials** - See token refresh guide
- **Project Setup** - Review CLAUDE.md for developer guidance

---

## 📋 Quick Reference

### Useful Commands

```bash
# Start n8n
cd n8n && docker-compose up -d

# Stop n8n
cd n8n && docker-compose down

# View n8n logs
docker logs -f n8n_container_name

# Access n8n UI
open http://localhost:5678

# Verify API token is valid (Instagram)
curl "https://graph.facebook.com/v16.0/$IG_USER_ID?fields=id,username&access_token=$IG_ACCESS_TOKEN"
```

### Important Dates & Deadlines

- **Token Refresh:** Check Instagram/Facebook tokens every 60 days
- **YouTube Reauth:** Check YouTube credentials every 30 days
- **Data Backup:** Regular backups of Notion database recommended

---

**Last Updated:** February 12, 2026
**Project Status:** Active Development - Phase 1 (Multi-Platform Posting)
**Maintained By:** Matt Taylor (@StPeteMusic)
