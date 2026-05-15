# Skill Swap Marketplace

Skill Swap Marketplace is a platform that allows users to exchange skills with others. Users can teach their skills and learn new ones without monetary transactions. The platform includes features like user registration, skill management, skill swap requests, messaging, and real-time notifications.

---

## Table of Contents

1. Features
2. Technologies Used
3. Setup Instructions
4. Backend API Endpoints
5. Frontend Pages
6. Project Structure

---

## Features

- **User Registration and Login**: Users can register and log in to the platform.
- **Skill Management**: Users can add, edit, and delete skills they can teach or want to learn.
- **Skill Swap Requests**: Users can send and manage skill swap requests.
- **Messaging**: Users can chat with others in real-time.
- **Real-Time Notifications**: Notifications for new messages and skill swap requests using WebSockets.

---

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (via Mongoose)
- Socket.IO
- JSON Web Tokens (JWT) for authentication

### Frontend
- React.js
- Vite
- TailwindCSS
- Axios for API requests
- React Router for navigation

---

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- MongoDB instance running
- `.env` files configured for both frontend and backend

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

### Project Structure

#### Backend
```
backend/
├── controllers/
├── db/
├── middlewares/
├── model/
├── routes/
├── services/
├── socket.js
├── app.js
├── server.js
└── .env
```