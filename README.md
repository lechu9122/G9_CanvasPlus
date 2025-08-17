# CanvasPlus

CanvasPlus is an **AI‑powered student dashboard** that synchronizes
Canvas tasks with your personal calendar to create a personalised, smart
homepage for managing study schedules. The project has been restructured
into a **monorepo** with separate front‑end and back‑end subprojects so
that the UI and API can be developed and deployed together.

## Repository structure

| Path         | Purpose                     |
| ------------ | --------------------------- |
| `client/`    | React/Vite front‑end source |
| `server/`    | Spring Boot back‑end source |
| `.gitignore` | Ignore rules                |

### Client

The `client` folder contains a React + Vite application. It provides the
user interface where students can see upcoming Canvas deadlines, events
and AI‑generated content. Vite handles local development, hot‑module
reloading and production builds.

### Server

The `server` folder is a Spring Boot application. It exposes REST
endpoints that the front‑end consumes. Endpoints include:

- `GET /api/ai/ping` -- returns `ok` to indicate the AI service is
  alive
- `POST /api/ai/complete` -- accepts a plain‑text prompt and returns a
  completion from
  OpenAI
- `GET /api/db/ping` -- pings the database and returns the server time
  and DB
  user.

The server uses environment variables for secrets such as the OpenAI API
key and Supabase credentials; these are defined in a `.env` file and
referenced in
`server/src/main/resources/application.properties`

## Prerequisites

- **Node.js** (version 18 or later) and **npm** -- for the front‑end.
- **Java 17** and **Maven** (the repo uses the Maven Wrapper `./mvnw`)
  -- for the back‑end.
- A `.env` file in the `server` directory containing values for:
- `OPENAI_API_KEY` -- your OpenAI API key.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SIGNER` -- Supabase
  credentials.
- `SUPABASE_DATABASE_URL`, `SUPABASE_DATABASE_USER`,
  `SUPABASE_DATABASE_PASSWORD` -- database connection details.

## Setup

1. Clone the repository and change into the project directory.

2. Copy `server/.env.example` (if present) to `server/.env` and fill in
    the required secrets listed above.

3. Install client dependencies:

<!-- -->

    cd client
    npm install

1. (Optional) Install root‑level dependencies for running both services
    together:

<!-- -->

    npm install

## Running the project

### Run the back‑end only

1. Load environment variables from `.env` and start Spring Boot:

<!-- -->

    cd server
    export $(grep -v '^#' .env | xargs)
    ./mvnw spring-boot:run

1. The server starts on port 8080 (configurable via
    `application.properties`

### Run the front‑end only

1. Start the Vite dev server:

<!-- -->

    cd client
    npm run dev

1. Visit `http://localhost:5173` in your browser. API requests
    beginning with `/api` will be proxied to `http://localhost:8080` if
    you set up `server.proxy` in `client/vite.config.js`.

### Run both concurrently

At the root of the repository you can use a single npm command to start
both services:

    npm start

This uses the `concurrently` package defined in the root `package.json`
to run `npm --workspace client run dev` and
`bash -c "cd server && export $(grep -v '^#' .env | xargs) && ./mvnw spring-boot:run"`
in parallel.

## Building for production

To build the front‑end for production and package the server:

    cd client && npm run build    # creates static assets in client/dist
    cd ../server && ./mvnw package  # creates a fat JAR under server/target

You can serve the `client/dist` folder from any static web server and
deploy the back‑end JAR to your favourite Java hosting environment.

## Testing

The back‑end includes JUnit tests under `server/src/test/java`. Run them
with:

    cd server
    ./mvnw test

## Contributing

Please fork this repository and submit pull requests. When contributing
code, follow the existing project structure: UI work goes in `client`,
server work goes in `server`, and update this README if you introduce
new scripts or configuration.

------------------------------------------------------------------------
