# Fashion Cash Flow — Development Guidelines

This project is a standalone TanStack Start + React + TypeScript application with a Spring Boot backend.

## Project Structure

- `/src` - Frontend (TanStack Start + React + TypeScript)
- `/backend` - Backend (Java + Spring Boot + PostgreSQL)

## Development Commands

```bash
# Frontend
npm install
npm run dev

# Backend
docker compose up -d
cd backend
mvn spring-boot:run
```

## Key Technologies

- **Frontend:** TanStack Start, React 19, TypeScript, Tailwind CSS 4, Radix UI
- **Backend:** Spring Boot 4, Java 17, PostgreSQL, WebSocket
- **Database:** PostgreSQL (production), localStorage (MVP frontend)