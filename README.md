# To-Do List API – Backend (Node.js + Express + MySQL)

This is the backend for the Full-Stack To-Do List Application. It exposes a RESTful API built with Node.js, Express, and MySQL to manage tasks (CRUD operations).

## 📦 Tech Stack

- Node.js
- Express.js
- MySQL (hosted on AWS EC2)
- dotenv
- CORS
- body-parser

## 📄 API Features

- Create a task
- Get all tasks
- Update a task
- Delete a task
- Manage task state: `started`, `stopped`, `finished`, `deleted`

## 🗃 Database Schema

The `tasks` table includes the following fields:

| Field        | Type                                       | Notes                                 |
|--------------|--------------------------------------------|---------------------------------------|
| id           | INT                                        | Primary key, auto-increment           |
| title        | VARCHAR(255)                               | Required                              |
| description  | TEXT                                       | Optional                              |
| state        | ENUM('started', 'stopped', 'finished', 'deleted') | Default: `started`              |
| created_at   | DATETIME                                   | Default: current timestamp            |
| updated_at   | DATETIME                                   | Auto-updated on modification          |

### SQL Script to Create Table

```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    state ENUM('started', 'stopped', 'finished', 'deleted') DEFAULT 'started',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);```

⚙️ Setup Instructions
	1.	Clone the repository

git clone https://github.com/bright77777/backend-ouibus.git
cd backend-ouibus

	2.	Install dependencies

npm install

	3.	Environment variables

The .env file is already included in the repository. It contains:


	4.	Start the server

npm run dev

The server will be running at:

http://localhost:5001


📝 Notes
	•	The backend connects to a MySQL database hosted on an AWS EC2 instance.
	•	The .env file is present and preconfigured for local deployment.
	•	No authentication or advanced features implemented.

