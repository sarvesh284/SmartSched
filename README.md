# ScheduleForge

Academic Timetable Generator - Full-stack web application for auto-generating conflict-free academic timetables.

## Features

- **CSP-based Scheduling Algorithm** - Uses Constraint Satisfaction Problem solver with MRV heuristic and forward checking
- **Elective Synchronization** - Schedules Professional (PE) and Open (OE) electives across divisions
- **Drag-and-Drop Editing** - Move slots with real-time conflict validation
- **AI Data Extraction** - Extract faculty/room/subject data from images using Gemini API
- **Multi-class Support** - Generate timetables for multiple classes simultaneously
- **Export Options** - Download timetables as Excel or PDF
- **Role-based Access** - Admin and Faculty user roles

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, Framer Motion, dnd-kit
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
- **AI:** Google Gemini API
- **Auth:** JWT, bcryptjs

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account or local MongoDB

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Atharv-Pawar01/ScheduleForge.git
   cd ScheduleForge
   ```

2. Install Backend dependencies
   ```bash
   cd Backend
   npm install
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URL, JWT secret, and Gemini API key
   ```

4. Install Frontend dependencies
   ```bash
   cd ../Frontend
   npm install
   ```

### Running the Application

1. Start the Backend server
   ```bash
   cd Backend
   node index.js
   ```

2. Start the Frontend dev server
   ```bash
   cd Frontend
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Project Structure

```
ScheduleForge/
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   └── middleware/     # Auth middleware
│   └── index.js            # Entry point
├── Frontend/
│   └── src/
│       ├── Components/     # React components
│       ├── Context/        # Auth context
│       └── router/         # Route definitions
└── README.md
```

## License

MIT
