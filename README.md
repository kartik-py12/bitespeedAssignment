# Bitespeed Identity Reconciliation Service

A Node.js TypeScript web service that implements identity reconciliation for customer contacts, linking orders made with different contact information to the same person.

## Overview

This service provides an `/identify` endpoint that consolidates customer contact information based on shared email addresses or phone numbers. It implements the identity reconciliation logic as specified in the Bitespeed backend task.

## Features

- **Contact Linking**: Automatically links contacts with shared email or phone numbers
- **Primary/Secondary Management**: Maintains primary-secondary relationships between contacts
- **Consolidation**: Returns consolidated contact information including all emails, phone numbers, and linked contact IDs
- **RESTful API**: Clean REST API with JSON request/response format
- **SQLite Database**: Uses SQLite for data persistence with proper schema
- **TypeScript**: Fully typed codebase for better development experience

## 🚀 Live Deployment

**Live Endpoint**: [https://bitespeedassignment-1nno.onrender.com/identify](https://bitespeedassignment-1nno.onrender.com/)

The `/identify` endpoint is accessible at: `https://bitespeedassignment-1nno.onrender.com/identify`

## API Endpoints

### POST /identify

Identifies and consolidates customer contact information.

### For example:

If a customer placed an order with 
`email=lorraine@hillvalley.edu` & `phoneNumber=123456` 
and later came back to place another order with 
`email=mcfly@hillvalley.edu` & `phoneNumber=123456` ,
database will have the following rows:

```javascript

{
	id                   1                   
  phoneNumber          "123456"
  email                "lorraine@hillvalley.edu"
  linkedId             null
  linkPrecedence       "primary"
  createdAt            2023-04-01 00:00:00.374+00              
  updatedAt            2023-04-01 00:00:00.374+00              
  deletedAt            null
},
{
	id                   23                   
  phoneNumber          "123456"
  email                "mcfly@hillvalley.edu"
  linkedId             1
  linkPrecedence       "secondary"
  createdAt            2023-04-20 05:30:00.11+00              
  updatedAt            2023-04-20 05:30:00.11+00              
  deletedAt            null
}
```

**Request Body:**
```json
{
	"email": "mcfly@hillvalley.edu",
	"phoneNumber": "123456"
}
```

**Response:**
```json
{
	"contact":{
		"primaryContatctId": 1,
		"emails": ["lorraine@hillvalley.edu","mcfly@hillvalley.edu"]
		"phoneNumbers": ["123456"]
		"secondaryContactIds": [23]
	}
}
```

### GET /health

Health check endpoint to verify service status.

## Local Development

### Installation

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   npm run test:api
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

## Database Schema

The service uses a SQLite database with the following `Contact` table schema:

```sql
CREATE TABLE Contact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES Contact(id)
);
```

## How It Works

1. **New Contact**: If no existing contact matches the provided email/phone, creates a new primary contact
2. **Partial Match**: If contact exists with matching email OR phone (but not both), creates a secondary contact linked to the primary
3. **Multiple Primaries**: If multiple primary contacts are found with shared information, consolidates them by making the oldest one primary and others secondary
4. **Exact Match**: If exact contact already exists, returns consolidated information without creating new records

## Examples

### Example 1: First Contact
**Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Example 2: Secondary Contact Creation
**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

## Technology Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite3
- **Validation**: Custom validation middleware
- **Security**: Helmet.js for security headers
- **CORS**: Cross-origin resource sharing enabled


## Project Structure

```
src/
├── controllers/     # Request handlers
├── database/        # Database configuration and connection
├── routes/          # API route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── scripts/         # Testing utilities
└── server.ts        # Main application entry point
```

## Development Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run test:api` - Test the API endpoints

## License

MIT License

## DEVELOPER

[Kartik](https://github.com/kartik-py12)