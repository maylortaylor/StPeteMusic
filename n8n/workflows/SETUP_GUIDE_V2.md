# Notion Post Creator v2 - Setup Guide

## What's New in v2?

### ✅ Fixed Issues
- **Proper Notion property mapping** - Changed from `simple: true` to `simple: false` with full property configuration
- **All 13+ database fields mapped** - Caption, Platform, Status, Post Date, Post Time, Event Type, Media Type, Hashtags, Tags, YT Playlist, YT Tags, Notes, Privacy Status
- **JSON-structured outputs** - All nodes return properly formatted JSON data
- **Better tool descriptions** - AI knows exactly what format to use

### ✅ Improved Features
- **Updated hashtag rules** - 3-6 hashtags max using #StPeteMusic, #StPeteFL, #SuiteEStudios, #StPetersburg, #TampaBay
- **Always includes @Suite.E.Studios** in Tags/Mentions field
- **YouTube defaults** - Automatically sets YT Playlist to default URL and generates YT Tags
- **Event Type defaults to "Music"** - Most posts will be music-related
- **Comprehensive system prompt** - 2000+ character brand guidelines and instructions

## Import Instructions

### Step 1: Import Workflow into n8n
1. Open n8n web interface
2. Click **"Workflows"** in sidebar
3. Click **"Import"** button (top right)
4. Select `notion-post-creator-v2.json` file
5. Workflow will import with 6 nodes

### Step 2: Configure Credentials

You'll need to reconnect 2 credentials:

#### A. GROQ API Credential
1. Click on **"GROQ Chat Model"** node
2. In the **Credentials** dropdown, select your existing "Groq API" credential
3. If not set up yet:
   - Click "Create New Credential"
   - Name: "Groq API"
   - API Key: Your GROQ API key from https://console.groq.com
   - Save

#### B. Notion API Credential
1. Click on **"Read Notion Posts"** node
2. Select your existing "Notion account 2" credential (ID: `ZXEH8wTvzaAHv60e`)
3. Click on **"Create Notion Post"** node
4. Select the same "Notion account 2" credential
5. If not connected yet, it should auto-reconnect since the credential ID is already in the JSON

### Step 3: Verify Database ID
1. Click on **"Create Notion Post"** node
2. Check that **Database ID** shows: `49cebf36f8774bd69c4329d2c0d750c5`
3. If it shows a different database, update it to the correct one
4. Repeat for **"Read Notion Posts"** node

### Step 4: Test the Workflow
1. Click **"Save"** (top right)
2. Click **"Test workflow"** button
3. In the chat input, type:
   ```
   Create posts for Final Friday on February 28, 2026 featuring The Velcros, Sunset Drive, and Neon Waves. Doors at 7pm, first band at 8pm.
   ```
4. Watch the execution:
   - AI Agent receives your message
   - Calls "Read Notion Posts" to check existing posts
   - Calls "Create Notion Post" 3 times (IG, FB, YT)
   - Returns confirmation message

### Step 5: Check Notion Database
1. Open your Notion database
2. You should see **3 new entries**:
   - One for Instagram
   - One for Facebook
   - One for YouTube
3. All entries should have:
   - ✅ Status = "Draft"
   - ✅ Privacy Status = "Public"
   - ✅ Caption/Text filled in
   - ✅ Platform set correctly
   - ✅ Post Date = 2026-02-28
   - ✅ Post Time = "7:00 PM"
   - ✅ Hashtags (3-6 tags)
   - ✅ Tags/Mentions includes @Suite.E.Studios
   - ✅ Event Type = "Music"
   - ❌ Media Link = empty (you add this later)

## How to Use

### Example Commands

**Create event posts:**
```
Create posts for Final Friday on March 28 with The Rockets and Blue Moon Band
```

**Create announcement posts:**
```
Create posts announcing our new venue partnership with Downtown Records
```

**Create specific platform post:**
```
Create an Instagram post about this Friday's jam session
```

**Multi-turn conversation:**
```
User: Create posts for Saturday's show with Indie Band
AI: [Creates 3 posts]
User: Make the Facebook one more casual
AI: [Updates FB post]
```

### Tips for Best Results

1. **Include key details**: Band names, date, time, ticket info
2. **Mention event type**: "Final Friday", "Instant Noodles", "special show"
3. **Be specific about platform**: "for Instagram" or "for all platforms"
4. **Use conversation memory**: "Make it shorter", "Add more energy"
5. **Check Notion after each request** to verify posts were created correctly

## Troubleshooting

### Issue: "Failed to create Notion page"
**Solution**: Check that all Notion property names match exactly:
- Caption/Text (not just "Caption")
- Tags/Mentions (not "Tags")
- Post Date (not "Date")
- Post Time (not "Time")

### Issue: "Select value not found"
**Solution**: Verify your Notion database has these exact select options:
- **Platform**: IG, FB, YT, TikTok
- **Status**: Draft, Ready, Posted, Error
- **Privacy Status**: Public, Private, Unlisted, Scheduled, Draft
- **Event Type**: Music, Event, Announcement
- **Media Type**: Image, Video, Carousel, Text Only

### Issue: Fields are empty in Notion
**Solution**:
1. Check the execution log in n8n (click on each node)
2. Verify the AI Agent is returning proper JSON format
3. Check that property keys match exactly in the "Create Notion Post" node

### Issue: YouTube posts missing YT Playlist
**Solution**: AI should automatically add this, but verify:
1. The system prompt includes YT Playlist instructions
2. The node maps `$json.ytPlaylist` to "YT Playlist" field
3. Default URL is: `https://youtu.be/fmHeR6omlwI?si=3knraNqLG8NogjPl`

## Property Mapping Reference

| Notion Property | Node Mapping | Example Value |
|----------------|--------------|---------------|
| Caption/Text | `$json.caption` | "Join us for Final Friday!" |
| Platform | `$json.platform` | "IG", "FB", "YT" |
| Status | Always "Draft" | "Draft" |
| Privacy Status | Always "Public" | "Public" |
| Event Type | `$json.eventType` or "Music" | "Music" |
| Media Type | `$json.mediaType` or "Image" | "Image", "Video" |
| Post Date | `$json.postDate` | "2026-02-28" |
| Post Time | `$json.postTime` | "7:00 PM" |
| Hashtags | `$json.hashtags` | "#StPeteMusic #StPeteFL" |
| Tags/Mentions | `$json.tags` | "@Suite.E.Studios @bandname" |
| YT Playlist | `$json.ytPlaylist` | "https://youtu.be/..." |
| YT Tags | `$json.ytTags` | "st pete music, local music" |
| Notes | `$json.notes` | "Optional internal notes" |

## Workflow Architecture

```
Chat Trigger
    ↓
AI Agent (GROQ gpt-oss-20b)
    ├── Conversation Memory (1000 tokens)
    └── Tools:
        ├── Read Notion Posts (check existing posts)
        ├── Create Notion Post (add new entry with all properties)
        └── Think (reasoning for complex requests)
```

## Next Steps

1. **Test thoroughly** - Try different types of posts
2. **Verify all properties** - Check each field in Notion
3. **Fine-tune system prompt** - Adjust brand voice if needed
4. **Add more tools** (future):
   - Update Notion Post (edit existing entries)
   - Delete Notion Post
   - EventBrite integration
   - Auto-posting when Status → "Ready"

## Support

If you encounter issues:
1. Check the execution logs in n8n (click on each node to see data)
2. Verify credential connections
3. Confirm Notion property names match exactly
4. Check GROQ API quota/limits

**Working directory**: `/Users/matttaylor/Documents/_dev/maylortaylor/StPeteMusic/n8n/workflows/`
