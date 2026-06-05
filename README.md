# Compiler Visualizer

A small compiler frontend and backend with visualizers for lexer, parser (AST), intermediate-code (TAC/DAG), optimizer, and code generation. This repo contains a Java Spring Boot backend that performs compilation phases and a Vite + React frontend that visualizes each phase.

## Tech stack

- Backend: Java 11+ with Spring Boot (Maven) — see [backend/pom.xml](backend/pom.xml)
- Frontend: React + Vite (ESM) — see [frontend/package.json](frontend/package.json)
- Optional: Dockerfile for the backend — see [backend/Dockerfile](backend/Dockerfile)

## Project layout

- [backend](backend): Spring Boot service that exposes compilation endpoints.
  - Main app: [backend/src/main/java/com/compiler/backend/BackendApplication.java](backend/src/main/java/com/compiler/backend/BackendApplication.java)
  - API controller: [backend/src/main/java/com/compiler/backend/controllers/CompilerController.java](backend/src/main/java/com/compiler/backend/controllers/CompilerController.java)
  - Services for each phase: `LexerService`, `ParserService`, `SemanticAnalyzerService`, `IcgService`, `OptimizerService`, `CodegenService` in [backend/src/main/java/com/compiler/backend/services/](backend/src/main/java/com/compiler/backend/services/)

- [frontend](frontend): Vite + React app with visualizers and phase components.
  - App entry: [frontend/src/main.jsx](frontend/src/main.jsx)
  - Visualizers: [frontend/src/components/visualizers/](frontend/src/components/visualizers/)
  - Phase pages: [frontend/src/components/phases/](frontend/src/components/phases/)

## Features

- Run individual compiler phases (lexing, parsing, semantic analysis, ICG, optimization, codegen) via the backend API
- Visualize AST, DAG/TAC, Lexer DFA, and other intermediate representations in the browser
- Minimal, modular services in backend to experiment with compiler algorithms

## Prerequisites

- Java 11+ (JDK)
- Maven
- Node 16+ / npm (for frontend)
- Docker (optional, for containerizing backend)

## Quick start (development)

Backend (from project root):

```bash
# build and run backend with Maven
mvn -f backend clean package
mvn -f backend spring-boot:run
```

Or run the built jar:

```bash
java -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

Frontend (from project root):

```bash
cd frontend
npm install
npm run dev
```

By default Vite serves on port 5173; the frontend calls the backend API endpoints defined in
[backend/src/main/java/com/compiler/backend/controllers/CompilerController.java](backend/src/main/java/com/compiler/backend/controllers/CompilerController.java).

## Docker (optional)

Build and run the backend container:

```bash
docker build -t compiler-backend ./backend
docker run -p 8080:8080 compiler-backend
```

## Testing

- Backend tests: `mvn -f backend test`
- Frontend: no automated tests included by default (add as needed)

## Contributing

- Fixes and improvements welcome. For backend changes, follow Java package layout and run `mvn -f backend test` before pushing.
- For frontend changes, run `npm run dev` and verify visualizers in the browser.

## Key files

- [backend/pom.xml](backend/pom.xml)
- [backend/src/main/java/com/compiler/backend/controllers/CompilerController.java](backend/src/main/java/com/compiler/backend/controllers/CompilerController.java)
- [frontend/package.json](frontend/package.json)
- [frontend/src/components/visualizers/](frontend/src/components/visualizers/)

