# Skill Swap Marketplace

Skill Swap Marketplace is a full-stack platform that enables users to exchange skills with others, fostering a collaborative learning environment without monetary transactions. Users can teach, learn, and connect through real-time messaging, skill swap requests, and a social feed.

---

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [API Overview](#api-overview)
6. [Frontend Overview](#frontend-overview)
7. [Contribution Guidelines](#contribution-guidelines)
8. [License](#license)

---

## Features
- **User Registration & Login**: Secure authentication with JWT and cookies.
- **Skill Management**: Add, edit, and delete skills to teach or learn.
- **Skill Swap Requests**: Request, accept, or reject skill swaps with other users.
- **Messaging**: Real-time chat with notifications using WebSockets.
- **Feed/Posts**: Share posts with media, like/unlike posts, and view a social feed.
- **Profile Management**: View and edit user profiles.
- **Marketplace**: Browse users and skills available for swapping.

---

## Tech Stack

### Backend
- Node.js, Express.js
- MongoDB (Mongoose)
- Socket.IO (real-time messaging)
- JWT (authentication)
- Redis (caching)
- Cloudinary (media uploads)

### Frontend
- React.js (Vite)
- TailwindCSS
- Axios (API requests)
- React Router

---

## Project Structure

```
Skill Swap/
├── backend/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── model/
│   ├── routes/
│   ├── services/
│   ├── socket.js
│   ├── app.js
│   ├── server.js
│   ├── API_DOCUMENTATION.md
│   └── .env
└── Frontend/
    ├── public/
    └── src/
        ├── assets/
        ├── components/
        ├── context/
        ├── pages/
        └── services/
```

---

## Setup Instructions

### Prerequisites
- Node.js & npm
- MongoDB instance (local or cloud)
- Cloudinary account (for media uploads)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the Frontend directory:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file if needed (e.g., for API base URL):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```

---

## API Overview

The backend exposes a RESTful API for all core features. See `backend/API_DOCUMENTATION.md` for full details and request/response examples.

### Main Endpoints
- **User**: Register, login, profile, list users
- **Skills**: Add, get, delete skills to teach/learn
- **Skill Swap**: Request, accept, reject, list swaps
- **Messages**: Send, receive, list messages
- **Posts**: Create, list, like/unlike posts

**Authentication**: Most endpoints require JWT (sent via cookies or Authorization header).

---

## Frontend Overview

- Built with React (Vite) and TailwindCSS
- Pages: Landing, Login, Dashboard, Feed, Marketplace, Messaging, Profile, SwapFlow, UserProfile, Docs
- Context Providers: Auth, Socket, VideoCall
- Components: Navbar, Footer, Layout, ProtectedRoute, VideoCallModal, etc.
- Services: API abstraction for backend communication

---

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bugfix.
2. Follow the existing code style and structure.
3. Write clear commit messages.
4. Test your changes locally before submitting a pull request.
5. For major changes, open an issue first to discuss your proposal.

---

## License

This project is licensed under the MIT License.
