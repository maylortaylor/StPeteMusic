# HTTP Node Raw Body Configuration

**Copy everything below (from the line after "START COPY HERE" to "END COPY HERE") and paste into N8N HTTP node's Raw Body field.**

---

## START COPY HERE

---
title: "{{ $json.platform }} Post - {{ $json.postDate }}"
type: content
status: draft
platform: {{ $json.platform }}
band-name: "{{ $json.bandNameString }}"
band-username-ig: "{{ $json.bandUsernameIG }}"
publish-date: "{{ $json.postDate }}"
publish-time: "{{ $json.postTime }}"
caption: "{{ $json.caption }}"
hashtags: "{{ $json.hashtags }}"
mentions: "{{ $json.mentions }}"
yt-tags: "{{ $json.ytTags }}"
yt-playlist: "{{ $json.ytPlaylist }}"
media-link: "{{ $json.mediaLink }}"
media-type: {{ $json.mediaType }}
privacy-status: unlisted
ai-generated: true
ai-generated-date: {{ now('YYYY-MM-DD') }}
created-date: {{ now('YYYY-MM-DD') }}
---

# YouTube Post Draft

*Auto-populated: {{ now('YYYY-MM-DD HH:mm') }}*

## Title (Video Title)

<% tp.frontmatter["caption"] %>

---

## Description (Video Description)

> Status: <% tp.frontmatter["status"] %>
> Platform: <% tp.frontmatter["platform"] %>
> AI Generated: <% tp.frontmatter["ai-generated"] %>

Your full description goes here...

---

## Band Info - AUTO-FILLED

| Property | Value |
|----------|-------|
| **Band Name** | <% tp.frontmatter["band-name"] %> |
| **Band Instagram** | <% tp.frontmatter["band-username-ig"] %> |

---

## Key Info - AUTO-FILLED

| Property | Value |
|----------|-------|
| **Post Date** | <% tp.frontmatter["publish-date"] %> |
| **Post Time** | <% tp.frontmatter["publish-time"] %> |
| **Platform** | <% tp.frontmatter["platform"] %> |
| **Status** | <% tp.frontmatter["status"] %> |
| **Privacy** | <% tp.frontmatter["privacy-status"] %> |

---

## Tags & Hashtags - AUTO-FILLED

**Hashtags:**
<% tp.frontmatter["hashtags"] %>

**YouTube Tags:**
<% tp.frontmatter["yt-tags"] %>

**Mentions (Instagram Usernames):**
<% tp.frontmatter["mentions"] %>

---

## Media - AUTO-FILLED

| Property | Value |
|----------|-------|
| **Video Link** | <% tp.frontmatter["media-link"] %> |
| **Media Type** | <% tp.frontmatter["media-type"] %> |
| **Playlist** | [View Playlist](<% tp.frontmatter["yt-playlist"] %>) |

---

## Publishing Checklist

- [ ] Title filled in
- [ ] Description/caption complete
- [ ] Video link added
- [ ] Tags & hashtags set
- [ ] Media type set
- [ ] Privacy set to "<% tp.frontmatter["privacy-status"] %>" (for review)
- [ ] Status changed to "ready"
- [ ] Ready for N8N to post

---

## Additional Notes

*Add any additional notes or edits below:*

---

## Tags
#stpetemusic #suiteestudios #youtube

## END COPY HERE

---

## N8N HTTP Node Settings

| Setting | Value |
|---------|-------|
| **Method** | PUT |
| **URL** | `http://host.docker.internal:27123/vault/StPeteMusic/Content/Drafts/{{ $json.platform }}-{{ now('YYYY-MM-DD-HHmmss') }}.md` |
| **Authentication** | HTTP Bearer Auth (Obsidian API) |
| **Send Body** | ON |
| **Body Type** | Raw |
| **Content Type** | `text/plain; charset=utf-8` |
| **Raw Body** | Paste the content between START COPY HERE and END COPY HERE above |
