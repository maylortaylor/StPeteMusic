# Notion Post Creator Workflow - Quick Start Guide

## What Is This?

The **Notion Post Creator** is an AI-powered chat interface that helps you create social media posts in seconds. Instead of writing captions manually, you describe what you want (e.g., "Create posts for Final Friday"), and the AI generates platform-specific posts and adds them to your Notion database automatically.

## How It Works

```
You: "Create an Instagram post for Final Friday on Feb 28"
  ↓
[AI reads past posts for style reference]
  ↓
[AI generates caption + hashtags matching your brand voice]
  ↓
[AI creates Notion database entry with Status=Draft]
  ↓
You: Add media URL to Notion + change Status to "Ready"
  ↓
[Run "Notion to Social Media Posting" workflow to publish]
```

## Quick Start: 5 Minutes

### 1. Open the Chat Interface
1. Go to n8n UI (http://localhost:5678)
2. Click **Workflows** → **Notion Post Creator**
3. Click the **Chat** button in the top right

### 2. Request Posts via Chat
Type natural language requests like:

#### Single Platform
- "Create an Instagram post for Final Friday on February 28"
- "Make a Facebook post about Instant Noodles next Wednesday"
- "Generate a YouTube video description for [band name]"

#### Multiple Posts
- "Create posts for all platforms for The Groove Merchants"
- "Make Instagram and Facebook posts for the Art Walk"

#### Follow-ups (Uses Memory)
```
You: "Create posts for Final Friday"
AI: [Creates 3 posts: IG, FB, YT]

You: "Add one more for [band name]"
AI: [Adds another set of 3 posts]
```

### 3. Find Your Posts in Notion
1. Open your Notion database: [Social Media Posts](https://www.notion.so/your-db-id)
2. Filter by Status = "Draft"
3. Find the newly created posts

### 4. Add Media & Publish
1. Copy your media (image/video) URL from Google Drive or another source
2. Paste it into the **Media Link** field
3. Change **Status** from "Draft" to "Ready"
4. Run the **Notion to Social Media Posting** workflow
5. Watch your post go live! ✨

## Chat Command Examples

### Event Promotion
```
"Create Instagram and Facebook posts for Final Friday on February 28.
The headliner is The Groove Merchants,
and doors open at 7pm at Suite E Studios."
```

### Band Spotlight
```
"Make posts for all platforms promoting [band Instagram handle].
They're performing at Final Friday next month."
```

### Instant Noodles (Monthly Jam)
```
"Generate posts for Instant Noodles on the last Wednesday.
This is our community jam session."
```

### Multi-Band Event
```
"Create posts for three bands:
1. [Band 1]
2. [Band 2]
3. [Band 3]

Make separate posts for each platform (IG, FB, YT)."
```

## What AI Creates Automatically

The AI generates these fields for you:

| Field | Example | Notes |
|-------|---------|-------|
| **Caption** | "🎸 Live Music Tonight! Join us..." | Full post text, properly formatted |
| **Platform** | IG, FB, or YT | Separate posts per platform |
| **Hashtags** | #StPeteMusic #FinalFriday #LocalMusic | 10-15 for Instagram |
| **Tags/Mentions** | @bandname @suite.e.studios @stpetemusic | Platform-specific handles |
| **Media Type** | Reel, Image, Video | IG/FB: Reel or Image; YT: Video |
| **Post Date** | 2026-02-28 | From your chat description |
| **Post Time** | 19:00 (or 7:00 PM) | Defaults to 1 hour before doors |
| **Status** | Draft | Always "Draft" - you add media next |
| **Notes** | Optional context | Bands featured, special info, etc |

## What You Provide Manually

The AI can't add these (user responsibility):

| Field | What to Do |
|-------|-----------|
| **Media Link** | Copy Google Drive or Dropbox URL and paste |
| **Status Change** | Change from "Draft" → "Ready" when ready to post |
| **Image/Video Upload** | Prepare your media in Google Drive first |

## Pro Tips

### Tip 1: Prepare Your Media First
- Have your image/video ready in Google Drive
- Get the shareable link before creating posts
- Ensures you can publish immediately after

### Tip 2: Use Past Post Style
- The AI analyzes your 10 most recent Instagram posts
- If you want a different style, update the "IG_PastPosts" Google Sheet
- AI will match the new style in future posts

### Tip 3: Ask for Revisions
- "That caption is too long for Instagram"
- "Make it sound more energetic"
- "Add more emojis"
- AI remembers context and refines

### Tip 4: Batch Create Multiple Events
```
"Create posts for:
- Final Friday (Feb 28)
- Instant Noodles (Feb 26)
- Art Walk (Feb 8)

Make Instagram, Facebook, and YouTube posts for each."
```
AI will create 9 posts in one shot!

### Tip 5: Different Tone Per Platform
The AI automatically adapts:
- **Instagram:** Energetic, emoji-heavy, hashtag-rich, 2200 char limit
- **Facebook:** Conversational, detailed, focused on community
- **YouTube:** Professional title + full description, SEO-focused

## Notion Database Fields Reference

### Always Filled (by AI)
- ✅ Caption - Full post text
- ✅ Platform - IG / FB / YT
- ✅ Status - "Draft"
- ✅ Post Date - When to publish
- ✅ Hashtags - Platform-specific tags
- ✅ Tags/Mentions - Who to tag

### Often Filled (context-dependent)
- 📝 Post Time - Time to publish (defaults to 7pm)
- 📝 Media Type - Reel, Image, Video, Carousel
- 📝 Privacy Status - YouTube privacy level
- 📝 YouTube Playlist - Playlist to add video to
- 📝 Notes - Context about the post

### Always Empty (You Add Later)
- ❌ Media Link - You paste image/video URL here

## Troubleshooting

### "AI is asking for more info"
- The AI is being helpful! Provide more details:
  - What date? ("February 28")
  - What time? ("7pm doors, 8pm band starts")
  - Which bands? ("The Groove Merchants, The Nightingales")

### "Post wasn't created"
- Check n8n execution logs (Executions tab)
- Verify Notion API credentials are configured
- Try simpler request: "Create Instagram post for Final Friday"

### "Status is Draft but I added media"
- Make sure you changed the dropdown from "Draft" → "Ready"
- Notion requires the exact status value

### "Post didn't publish"
- Check Media Link URL is valid (should be Google Drive or Dropbox)
- Run "Notion to Social Media Posting" workflow manually
- Check for errors in n8n Executions tab

## Next Steps

1. ✅ Import workflow (done!)
2. ✅ Test with: "Create Instagram post for Final Friday"
3. ✅ Add media URL to Notion
4. ✅ Run "Notion to Social Media Posting" workflow
5. ✅ Celebrate! 🎉

## FAQ

**Q: Can I edit posts after creation?**
- A: Yes! Edit the Notion entry directly, but keep Status="Ready" to publish changes

**Q: How many posts can I create at once?**
- A: Unlimited! Try: "Create posts for 5 different events"

**Q: Does it work with YouTube Shorts?**
- A: The main "Notion to Social Media Posting" handles Shorts via YouTube API

**Q: Can I schedule posts?**
- A: Yes! Notion status "Ready" → Posting workflow publishes immediately OR set Post Date in the future

**Q: What if I want different captions for different platforms?**
- A: Already done! AI creates separate posts with platform-specific captions

**Q: Can I create posts for multiple bands at once?**
- A: Yes! Just list them: "Create posts for [Band 1], [Band 2], [Band 3]"

## Resources

- **Notion Database:** [Social Media Posts](https://www.notion.so/)
- **Google Sheet (Style Reference):** [IG_PastPosts](https://docs.google.com/spreadsheets/d/1kzzR8zPxxNmNmp7hXFwzWMoVZh7ZLC9GZBnob1UNYo8/)
- **Publishing Workflow:** notion-to-social-media-posting.json
- **n8n Docs:** https://docs.n8n.io/

---

**Happy posting! 🎶**

*Last updated: February 13, 2026*
