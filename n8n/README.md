# n8n Automation Engine

This directory contains the n8n workflow automation engine for @StPeteMusic.

## 📁 Directory Structure

```
n8n/
├── docker-compose.yaml      # n8n Docker configuration
├── README.md               # This file
├── workflows/              # All n8n workflows and scripts
│   ├── README.md          # Workflow documentation
│   ├── *.json             # Workflow definition files
│   └── *.js               # Helper scripts
└── local-files/           # Volume mount for n8n data
```

## 🚀 Quick Start

### Start n8n

```bash
cd n8n
docker compose up -d
```

n8n will be available at **http://localhost:5678**

### Stop n8n

```bash
docker compose down
```

## ⚙️ Configuration

- **Environment variables**: Uses `../.env` (at project root)
- **See**: `workflows/README.md` for workflow-specific setup

## 📚 Documentation

- **Workflows**: See `workflows/README.md` for complete workflow documentation
- **Project Setup**: See `../README.md` for project-wide guidance
- **Environment**: See `../.env.example` for required variables

---

**For workflow documentation, see `workflows/README.md`**
