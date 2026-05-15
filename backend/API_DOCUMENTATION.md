# Skill Swap Marketplace - API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication
Most endpoints require authentication via JWT token. The token should be sent in the request cookies or headers after login.

---

## User Endpoints

### 1. Register User
**POST** `/users/register`

Registers a new user account.

**Request Body:**
```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john@example.com",
  "password": "password123",
  "role": "Developer",
  "location": "New York",
  "bio": "I am a developer"
}
```

**Validation Rules:**
- `fullname.firstname` - Required, must not be empty
- `email` - Required, must be valid email format
- `password` - Required, minimum 6 characters
- `role` - Required, minimum 3 characters
- `location` - Required, minimum 3 characters
- `bio` - Required, minimum 3 characters

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "userId",
    "fullname": { "firstname": "John", "lastname": "Doe" },
    "email": "john@example.com",
    "role": "Developer",
    "location": "New York",
    "bio": "I am a developer"
  }
}
```

**Error Responses:**
- `409` - User already exists
- `422` - Validation error
- `500` - Internal server error

---

### 2. User Login
**POST** `/users/login`

Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email` - Required, must be valid email format
- `password` - Required, must not be empty

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "userId",
    "fullname": { "firstname": "John", "lastname": "Doe" },
    "email": "john@example.com",
    "role": "Developer",
    "location": "New York",
    "bio": "I am a developer"
  }
}
```

**Error Responses:**
- `404` - User not found
- `401` - Invalid credentials
- `422` - Validation error
- `500` - Internal server error

---

### 3. Get User Profile
**GET** `/users/profile`

Retrieves the authenticated user's profile.

**Authentication:** Required

**Response (201):**
```json
{
  "user": {
    "_id": "userId",
    "fullname": { "firstname": "John", "lastname": "Doe" },
    "email": "john@example.com",
    "role": "Developer",
    "location": "New York",
    "bio": "I am a developer"
  }
}
```

**Error Responses:**
- `404` - User not found
- `500` - Internal server error

---

### 4. Get All Users
**GET** `/users/all-users`

Retrieves all users except the authenticated user.

**Authentication:** Required

**Response (201):**
```json
{
  "users": [
    {
      "_id": "userId1",
      "fullname": { "firstname": "Jane", "lastname": "Smith" },
      "email": "jane@example.com",
      "role": "Designer",
      "location": "Los Angeles",
      "bio": "I am a designer"
    },
    {
      "_id": "userId2",
      "fullname": { "firstname": "Bob", "lastname": "Johnson" },
      "email": "bob@example.com",
      "role": "Marketer",
      "location": "Chicago",
      "bio": "I am a marketer"
    }
  ]
}
```

**Error Responses:**
- `404` - Could not get users
- `500` - Internal server error

---

## Skills Endpoints

### 1. Add Skill to Offer
**POST** `/skills/add-skills`

Adds a skill that the user offers to teach others.

**Authentication:** Required

**Request Body:**
```json
{
  "skill": "React",
  "des": "I can teach advanced React with hooks and context API"
}
```

**Validation Rules:**
- `skill` - Required, minimum 2 characters
- `des` - Required, minimum 5 characters

**Response (201):**
```json
{
  "skills": {
    "_id": "skillId",
    "user": "userId",
    "skill": "React",
    "des": "I can teach advanced React with hooks and context API",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Skill is required
- `500` - Internal server error

---

### 2. Get Offered Skills
**GET** `/skills/get-skills`

Retrieves all skills the authenticated user offers.

**Authentication:** Required

**Response (201):**
```json
{
  "skills": [
    {
      "_id": "skillId1",
      "skill": "React",
      "des": "I can teach advanced React with hooks and context API"
    },
    {
      "_id": "skillId2",
      "skill": "JavaScript",
      "des": "Expert in JavaScript ES6+ and async programming"
    }
  ]
}
```

**Error Responses:**
- `400` - No skill found
- `500` - Internal server error

---

### 3. Get Skills to Learn
**GET** `/skills/get-skillsToLearn`

Retrieves all skills the authenticated user wants to learn.

**Authentication:** Required

**Response (201):**
```json
{
  "skills": [
    {
      "_id": "skillId1",
      "skill": "Python",
      "des": "Want to learn Python for data science"
    },
    {
      "_id": "skillId2",
      "skill": "UI Design",
      "des": "Interested in learning UI design principles"
    }
  ]
}
```

**Error Responses:**
- `400` - No skill found
- `500` - Internal server error

---

### 4. Add Skill to Learn
**POST** `/skills/skills-to-learn`

Adds a skill that the user wants to learn.

**Authentication:** Required

**Request Body:**
```json
{
  "skill": "Python",
  "des": "Want to learn Python for data science"
}
```

**Validation Rules:**
- `skill` - Required, minimum 2 characters
- `des` - Required, minimum 5 characters

**Response (201):**
```json
{
  "skills": {
    "_id": "skillId",
    "user": "userId",
    "skill": "Python",
    "des": "Want to learn Python for data science",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Skill is required
- `500` - Internal server error

---

### 5. Delete Skill
**POST** `/skills/delete-skill`

Deletes a skill from the user's profile.

**Authentication:** Required

**Request Body:**
```json
{
  "skillId": "skillId123"
}
```

**Validation Rules:**
- `skillId` - Required, minimum 5 characters

**Response (201):**
```json
{
  "messsage": "Deleted successfully"
}
```

**Error Responses:**
- `404` - Id is required (validation error)
- `500` - Internal server error

---

## Skill Swap Endpoints

### 1. Request Skill Swap
**POST** `/skillSwap/request-swap`

Creates a skill swap request between two users.

**Authentication:** Required

**Request Body:**
```json
{
  "fromUser": "userId1",
  "toUser": "userId2",
  "offersSkill": "React",
  "requestsSkill": "Python"
}
```

**Validation Rules:**
- `fromUser` - Required, not empty
- `toUser` - Required, not empty
- `offersSkill` - Required, not empty
- `requestsSkill` - Required, not empty

**Response (201):**
```json
{
  "message": "Skill swap request created successfully",
  "skillSwap": {
    "_id": "swapId",
    "fromUser": "userId1",
    "toUser": "userId2",
    "offersSkill": "React",
    "requestsSkill": "Python",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `422` - Validation error
- `500` - Internal server error

---

### 2. Accept Skill Swap Request
**GET** `/skillSwap/accept-request-swap`

Accepts a skill swap request.

**Authentication:** Required

**Query Parameters:**
- `requestId` - Required, the ID of the swap request to accept

**URL Example:**
```
GET /skillSwap/accept-request-swap?requestId=swapId123
```

**Response (200):**
```json
{
  "message": "Skill swap request accepted successfully",
  "skillSwap": {
    "_id": "swapId",
    "fromUser": "userId1",
    "toUser": "userId2",
    "offersSkill": "React",
    "requestsSkill": "Python",
    "status": "accepted",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**
- `422` - Validation error (requestId missing)
- `500` - Internal server error

---

### 3. Reject Skill Swap Request
**GET** `/skillSwap/reject-request-swap`

Rejects a skill swap request.

**Authentication:** Required

**Query Parameters:**
- `requestId` - Required, the ID of the swap request to reject

**URL Example:**
```
GET /skillSwap/reject-request-swap?requestId=swapId123
```

**Response (201):**
```json
{
  "message": "Swap rejected"
}
```

**Error Responses:**
- `404` - Id is required (validation error)
- `500` - Internal server error

---

### 4. Get Accepted Swaps
**GET** `/skillSwap/accepted-swaps`

Retrieves all accepted skill swaps for the authenticated user.

**Authentication:** Required

**Response (201):**
```json
{
  "allUsers": [
    {
      "_id": "swapId1",
      "fromUser": { "_id": "userId1", "fullname": "John Doe" },
      "toUser": { "_id": "userId2", "fullname": "Jane Smith" },
      "offersSkill": "React",
      "requestsSkill": "Python",
      "status": "accepted"
    }
  ]
}
```

**Error Responses:**
- `500` - Internal server error

---

### 5. Get Pending Swaps
**GET** `/skillSwap/get-pending-swaps`

Retrieves all pending skill swap requests for the authenticated user.

**Authentication:** Required

**Response (201):**
```json
{
  "pendingSwaps": [
    {
      "_id": "swapId1",
      "fromUser": { "_id": "userId1", "fullname": "John Doe" },
      "toUser": { "_id": "userId2", "fullname": "Jane Smith" },
      "offersSkill": "React",
      "requestsSkill": "Python",
      "status": "pending"
    }
  ]
}
```

**Error Responses:**
- `500` - Internal server error

---

## Messages Endpoints

### 1. Get Messages
**GET** `/messages/get-messages`

Retrieves all messages in a conversation with another user.

**Authentication:** Required

**Query Parameters:**
- `userToChatId` - Required, the ID of the other user in the conversation

**URL Example:**
```
GET /messages/get-messages?userToChatId=userId123
```

**Response (201):**
```json
{
  "messages": [
    {
      "_id": "messageId1",
      "sender": "userId1",
      "receiver": "userId2",
      "text": "Hey, are you interested in learning React?",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "messageId2",
      "sender": "userId2",
      "receiver": "userId1",
      "text": "Yes! I'm very interested. When can we start?",
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

**Error Responses:**
- `404` - userToChatId is required (validation error)
- `500` - Internal server error

---

### 2. Send Message
**POST** `/messages/send-message`

Sends a message to another user.

**Authentication:** Required

**Request Body:**
```json
{
  "text": "Hey, are you interested in learning React?",
  "receiverId": "userId123"
}
```

**Validation Rules:**
- `text` - Required, message content
- `receiverId` - Required, ID of the receiving user

**Response (201):**
```json
{
  "messages": {
    "_id": "messageId",
    "sender": "userId1",
    "receiver": "userId2",
    "text": "Hey, are you interested in learning React?",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Real-time Update:**
If the receiver is online via WebSocket, they will receive:
```json
{
  "event": "new-message",
  "data": {
    "_id": "messageId",
    "sender": "userId1",
    "receiver": "userId2",
    "text": "Hey, are you interested in learning React?",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404` - Missing required fields (validation error)
- `500` - Internal server error

---

## Feed/Posts Endpoints

### 1. Create Post
**POST** `/posts/create`

Creates a new post with media (image or video).

**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
- `content` - String, post text
- `media` - File (image or video)

**Response (201):**
```json
{
  "post": {
    "_id": "postId",
    "user": { "_id": "userId", "fullname": "John Doe", ... },
    "content": "Check out my React skills!",
    "mediaUrl": "/uploads/media-123.png",
    "mediaType": "image",
    "likes": [],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get All Posts (Feed)
**GET** `/posts/all`

Retrieves all posts for the feed.

**Authentication:** Required

**Response (200):**
```json
{
  "posts": [
    {
      "_id": "postId1",
      "user": { "_id": "userId1", "fullname": "John Doe", ... },
      "content": "Post content",
      "mediaUrl": "/uploads/media-123.png",
      "mediaType": "image",
      "likes": ["userId2"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3. Like/Unlike Post
**POST** `/posts/like/:postId`

Toggles like status for a post.

**Authentication:** Required

**Response (200):**
```json
{
  "post": {
    "_id": "postId",
    "likes": ["userId1", "userId2"]
  }
}
```

---

## HTTP Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server-side error |

---

## Authentication Example

**Login to get token:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Use token in subsequent requests (via cookies):**
The token is automatically set as a cookie named `token` after login. For authenticated endpoints, make sure cookies are sent with requests.

**Alternative: Manual Bearer Token (if supported):**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

---

## Common Error Response Format

```json
{
  "message": "Error description",
  "error": "error details or validation errors array"
}
```

---

## Notes

- All endpoints marked with "Authentication: Required" need the user to be logged in
- The JWT token is stored in cookies after login
- Query parameters are appended to the URL with `?`
- All timestamps are in ISO 8601 format
- WebSocket support is available for real-time messaging
