# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an embeddable AI chat widget library that allows websites to integrate Steno AI chat functionality via simple script tags. The project consists of pure JavaScript files with no build process required.

## Architecture

### Core Components
- **steno-chat.js**: Main chat widget implementation with iframe-based interfaces, domain validation, and multiple display modes (default/panel/fullscreen)
- **steno-button.js**: Chat button component that lazy-loads the main chat script on click
- **niro.js**: Alternative fullscreen-only chat implementation for niro.steno.ai
- **index.html**: Test harness demonstrating widget integration

### Key Technical Patterns
- IIFE pattern for script isolation
- PostMessage API for secure iframe communication
- Domain validation via API calls to voice-api.steno.ai
- Lazy loading with requestIdleCallback
- Mobile detection and responsive behavior (≤768px)
- Data attributes for configuration (data-id, data-mode, data-position, etc.)

## Development Commands

Since this is a pure JavaScript project with no build tools:
- **Testing**: Open index.html in a browser
- **Deployment**: Push to GitHub; jsDelivr CDN auto-updates from tags
- **No build/compile steps needed**

## Important Implementation Details

### Security Considerations
- Always validate domains via the voice-api.steno.ai endpoint
- Check origin on all postMessage handlers
- Detect and skip loading for crawlers/bots
- Only allow https, tel, and mailto protocols

### Mobile Handling
- Panel mode automatically disabled on mobile devices
- Use window.innerWidth ≤ 768 for mobile detection
- Fullscreen mode preferred for mobile interfaces

### Client Configuration
When adding new clients, update the client-specific styling in steno-button.js (see the "afterall" example)

### CDN Distribution
Production URL: `https://cdn.jsdelivr.net/gh/aisteno/embed@latest/[filename].js`