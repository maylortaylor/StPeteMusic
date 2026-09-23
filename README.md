# StPeteMusic

Infrastructure, archives and brand notes for @StPeteMusic, a community music org in St. Petersburg, FL.

**The website and admin do not live here.** Since 2026-09-22, `stpetemusic.live`, `www` and `admin` serve from the roboBOREALIS platform (`clients/stpetemusic/` in `roboborealis/roboborealis-platform`). The n8n workflows run on the platform's services box at https://n8n.stpetemusic.live. The Next.js apps that used to be here were removed in #351.

---

## What this repo still owns

| Path | What it is |
|---|---|
| `infrastructure/` | OpenTofu. The live-stream CDN (`hls.stpetemusic.live`), the RTMP health check and alarms, the SNS alert topic, Cloudflare DNS for `stpetemusic.live`, and the GCP analytics projects. CI plans on every PR and applies on merge to `main`. |
| `n8n/workflows/StPeteMusic/` | Archive of the pre-platform n8n workflows. The live keepers are in the platform repo. |
| `database/` | Schema and migrations from the retired RDS database. History only. |
| `docs/` | Plans, runbooks, incident reports. Much of it describes the retired setup. |
| `.claude/` | Agent context. `infrastructure.md` in particular describes infra that no longer exists. |

Streaming: OBS or Restream publish to `rtmp://stream.stpetemusic.live/live`. mediamtx on the platform services box serves HLS, and `hls.stpetemusic.live` fronts it.

---

## Brand Reference

**@StPeteMusic** — Community music promoter, St. Petersburg FL

| Platform | URL |
|---|---|
| Instagram | https://www.instagram.com/StPeteMusic |
| Facebook | https://www.facebook.com/StPeteFLMusic |
| YouTube | https://youtube.com/@StPeteMusic |
| Linktree | https://linktr.ee/stpetemusic |

**Anchor Events:**
- **Final Friday** — Last Friday of each month, Suite E Studios
- **Instant Noodles** — Last Wednesday of each month, community jam
- **Second Saturday Art Walk** — Warehouse Arts District

**Team:** Matt Taylor (owner), Austen Van Der Bleek (co-owner), Rob Morey, Alex MacDonald

---

---

*Last updated: September 2026 | Maintained by Matt Taylor (@maylortaylor)*
