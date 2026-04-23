# Mytofy V2 - Developer Notes & System Design

*This document serves as a reference for the core engineering concepts, critical bugs faced, and system design decisions made during the development of Mytofy V2. You can export this Markdown file to a PDF for offline reference.*

---

## 1. Core Concept: Synchronous Playback Architecture
Synchronizing audio perfectly across multiple internet connections is a complex problem. Mytofy solves this using a "Time-Delta" approach rather than blindly sending "seek" commands.

**How it works:**
1. When the Host presses play, the server records the exact current epoch time: `startedAt = Date.now()`.
2. This timestamp is stored in Redis and broadcast to all users via Sockets.
3. When a Guest's client receives this payload (or when a late Guest joins the room), the client calculates exactly how much time has passed since the song started: 
   `const delayInSeconds = (Date.now() - startedAt) / 1000;`
4. The Guest's YouTube player then executes `player.seekTo(delayInSeconds)`.
**Why this is powerful:** It accounts for network latency. Even if the WebSocket message takes 500ms to reach the client, `Date.now()` will factor in that 500ms, ensuring perfect synchronization.

## 2. Core Concept: Host Scrubbing & Polling
YouTube's IFrame API does not provide a native `onScrub` or `onSeek` event. To sync the Host dragging the timeline without relying on hacky DOM listeners:
- We implemented a **Time Polling Engine** that runs `setInterval` every 1000ms exclusively on the Host's machine.
- It compares the player's `currentTime` with a `lastTimeRef`.
- If the difference is greater than the natural 1-second interval jump (e.g., `Math.abs(diff) > 2`), we know a manual seek occurred.
- The Host emits a `seek_song` event, and the server recalculates the `startedAt` time backwards to maintain the Time-Delta logic.

## 3. Core Concept: Browser Autoplay Policies
Modern browsers (Chrome, Safari, Edge) enforce strict Autoplay Policies: media with sound cannot auto-play unless the user has physically interacted with the DOM (clicked, tapped, typed).
- **The Issue:** Guests joining a room would not hear music because the WebSocket `playVideo()` command would be blocked by the browser.
- **The Solution (The "Interaction Gate"):** We added a `hasInteracted` state. If a Guest joins, a full-screen overlay blocks the YouTube player with a "Click to Join Audio" button. Once clicked, `hasInteracted` becomes true, satisfying the browser's policy and unlocking the socket commands.

## 4. Core Concept: Redis vs. MongoDB (Hybrid Database Design)
Using a standard SQL or NoSQL database for every socket event causes severe database thrashing and latency.
- **MongoDB** is used for data that must survive server restarts: Users, Passwords, and Chat History.
- **Redis** is an in-memory data store used for transient state: The current song, the playback timestamp, and the dynamic Queue. If the server crashes, room states might reset, which is acceptable for a live-streaming platform, but the speed tradeoff is worth it for real-time collaboration.

---

## Critical Bugs & Solutions

### 🔴 Bug 1: The "0:00 Reset" Bug
**The Issue:** When a host paused a song at 0:45 and later pressed play, the song would restart from 0:00 for everyone else.
**The Cause:** The server's `play_song` event was blindly setting `startedAt = Date.now()`. Since `delay = Date.now() - Date.now()`, the delay was always `0`.
**The Solution:** The client now sends its paused timestamp to the server. The server calculates a "backdated" timestamp: `startedAt = Date.now() - (timestamp * 1000)`.

### 🔴 Bug 2: React Router Authentication Redirect Loop
**The Issue:** Guests joining via a direct invite link (`/room/123`) were kicked to the login page. After logging in, they were sent to the Dashboard (`/home`) instead of the room.
**The Solution:** In `ProtectedRoute`, we captured the original URL using `window.location.pathname` and passed it into the React Router `<Navigate state={{ from: ... }}>` component. The Auth page then reads `location.state.from` and redirects them properly post-login.

### 🔴 Bug 3: YouTube iframe `postMessage` Errors (Cross-Origin)
**The Issue:** Constant red console errors complaining about `DOMWindow` and `origin`.
**The Solution:** We explicitly passed `origin: window.location.origin` in the `playerVars` configuration of `react-youtube`. We also wrapped `seekTo` and `playVideo` inside `try/catch` blocks to prevent the React component tree from crashing if the iframe wasn't fully hydrated yet.

### 🔴 Bug 4: Mobile Viewport Height Trapping
**The Issue:** `h-screen overflow-hidden` made the app look great on desktop but completely hid the chat and queue on mobile devices because scrolling was disabled.
**The Solution:** Transitioned to `min-h-screen lg:h-screen` and used CSS `clamp(200px, 40vh, 400px)` on the YouTube player to guarantee the video never consumed the entire screen on small devices, allowing natural vertical scrolling.
