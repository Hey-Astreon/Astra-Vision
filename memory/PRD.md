# Astra Vision – AI Dev Brain

## Overview
A developer tool that helps users explore GitHub repositories, view code, and get AI-powered explanations (mock responses for MVP).

## Tech Stack
- **Frontend**: React 18 + Tailwind CSS + Monaco Editor
- **Backend**: FastAPI (Python)
- **Icons**: Phosphor Icons
- **Diagrams**: Mermaid.js
- **No Database**: Stateless API
- **No Authentication**: Public access

## User Personas
1. **Developer**: Exploring unfamiliar codebases, needs quick code explanations
2. **Learner**: Understanding code patterns and debugging errors
3. **Team Lead**: Quickly reviewing repository structure

## Core Requirements (Static)
1. GitHub Repository Input - paste public repo URL, fetch structure
2. File Explorer - collapsible tree with 2-level depth
3. Monaco Code Viewer - syntax highlighting, read-only
4. Code Explanation - structured overview, key parts, summary
5. Error Debug - meaning, cause, fix for pasted errors
6. Flow Diagram - Mermaid.js visualization

## What's Been Implemented (March 30, 2026)
- [x] FastAPI backend with 3 endpoints (/api/explain-code, /api/explain-error, /api/generate-flow)
- [x] React frontend with VS Code-inspired dark theme
- [x] 3-pane layout (file explorer, code editor, AI panel)
- [x] GitHub API integration for fetching repo structure
- [x] Monaco Editor with auto language detection
- [x] Tab system for open files
- [x] Mock AI responses (structured, realistic)
- [x] Mermaid diagram rendering
- [x] Error handling and loading states
- [x] Custom scrollbars and VS Code styling
- [x] **Fixed API integration** - Backend returns `{success: true, data: {...}}` wrapper
- [x] **Fixed frontend handlers** - Changed from axios to native fetch, proper parsing: `if (data.success) { result = data.data; }`
- [x] **Demo Mode Fallback** - Automatic fallback to mock repo when GitHub API fails (rate limit, 404, etc.)
- [x] **Try Demo button** - Direct access to demo repository without GitHub URL
- [x] **Production-grade API wrapper** - safeFetch() with validation, fetchWithRetry() with 2 retries and 1.5s delay
- [x] **Improved error messages** - "No code loaded", "Service warming up", "Please enter an error message"

## API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/health | GET | Health check |
| /api/explain-code | POST | Returns code explanation |
| /api/explain-error | POST | Returns error debug info |
| /api/generate-flow | POST | Returns Mermaid diagram |

## Prioritized Backlog

### P0 (MVP - Done)
- [x] All core features implemented

### P1 (High Priority - Future)
- [ ] Real AI integration (GPT/Claude) for explanations
- [ ] GitHub OAuth for private repos
- [ ] Full repo depth exploration
- [ ] Code search within repository

### P2 (Medium Priority)
- [ ] Bookmark/save explanations
- [ ] Share explanation links
- [ ] Multiple language support for UI
- [ ] Dark/Light theme toggle

### P3 (Nice to Have)
- [ ] Code diff viewer
- [ ] Integration with VS Code extension
- [ ] Export explanations to Markdown
- [ ] Repository comparison

## Next Tasks
1. Preview environment warm-up (platform-level)
2. Consider adding real AI integration
3. Add GitHub rate limit handling improvements
4. Add more language support for Monaco editor
