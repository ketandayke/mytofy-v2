# Mytofy V2 - Real-time Collaborative Music Platform

![Mytofy Logo](https://img.shields.io/badge/Mytofy-V2-coral?style=for-the-badge)

## 🎵 What is Mytofy?
Mytofy is a real-time, perfectly synchronized music collaboration platform. It allows users to create public or private listening rooms where a "Host" can manage a queue of YouTube songs, control playback, and scrub the timeline—while everyone else in the room hears the exact same music at the exact same millisecond. 

## 💡 Why is this important?
In an increasingly remote world, shared experiences are vital. Mytofy bridges the gap in remote socialization by eliminating the "3, 2, 1, press play" problem. Whether studying together, hosting remote watch parties, or discovering new music with friends, Mytofy ensures everyone is always on the exact same beat, complete with real-time chat and queue collaboration.

## 🏗️ System Architecture
Mytofy utilizes a hybrid-database architecture to separate persistent records from high-frequency volatile state.

- **Frontend (Client):** A React application providing an immersive, fully responsive UI. It maintains an active WebSocket connection for instant state updates and embeds the native YouTube IFrame API for audio/video playback.
- **Backend (Server):** An Express.js REST API coupled with a Socket.io WebSocket server.
- **State Layer (Redis):** Handles high-frequency, volatile operations. The "Live Room State" (current song, playback status, timestamp, and song queue) is stored in Redis. This prevents database thrashing and ensures sub-millisecond read/write speeds for real-time synchronization.
- **Persistence Layer (MongoDB):** Handles long-term storage. User profiles, hashed passwords for private rooms, authentication credentials, and historical chat messages are safely persisted here.

## 💻 Tech Stack
**Frontend:**
- React (Vite)
- Tailwind CSS
- React Router DOM
- Socket.io-client
- React-YouTube (YouTube IFrame API wrapper)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- Socket.io
- MongoDB (Mongoose)
- Redis
- JSON Web Tokens (JWT) & bcrypt

## 🚀 Deployed Link
**Live Application:** https://mytofy-v2.vercel.app/
**Frontend Hosting:**  Vercel
**Backend Hosting:**  Render
**Databases:** MongoDB Atlas & Upstash

## 🛠️ Local Development Setup
1. Clone the repository.
2. Navigate to `/server` and run `npm install`.
3. Create a `/server/.env` file with `PORT`, `MONGODB_URI`, `REDIS_URL`, `ACCESS_TOKEN_SECRET`, etc.
4. Run the backend: `npm run dev`.
5. Navigate to `/client` and run `npm install`.
6. Create a `/client/.env` file with `VITE_API_URL`.
7. Run the frontend: `npm run dev`.
