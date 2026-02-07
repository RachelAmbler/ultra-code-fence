/**
 * Simple HTTP server with typed routes.
 *
 * Demonstrates TypeScript interfaces, generics, and async patterns.
 */

// ---- TYPES ----

interface Route {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handler: (req: Request) => Promise<Response>;
}

interface ApiResponse<T> {
    status: number;
    data: T;
    timestamp: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
}

// ---- DATA ----

const users: User[] = [
    { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
    { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
    { id: 3, name: "Charlie", email: "charlie@example.com", role: "guest" },
];

// ---- HELPERS ----

function jsonResponse<T>(data: T, status = 200): ApiResponse<T> {
    return {
        status,
        data,
        timestamp: new Date().toISOString(),
    };
}

function findUser(id: number): User | undefined {
    return users.find((u) => u.id === id);
}

// ---- ROUTES ----

const routes: Route[] = [
    {
        method: "GET",
        path: "/users",
        handler: async () => {
            return new Response(JSON.stringify(jsonResponse(users)));
        },
    },
    {
        method: "GET",
        path: "/users/:id",
        handler: async (req: Request) => {
            const url = new URL(req.url);
            const id = parseInt(url.pathname.split("/").pop() ?? "0");
            const user = findUser(id);

            if (!user) {
                return new Response(
                    JSON.stringify(jsonResponse(null, 404)),
                    { status: 404 }
                );
            }

            return new Response(JSON.stringify(jsonResponse(user)));
        },
    },
    {
        method: "GET",
        path: "/health",
        handler: async () => {
            return new Response(
                JSON.stringify(
                    jsonResponse({
                        status: "healthy",
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                    })
                )
            );
        },
    },
];

// ---- SERVER ----

async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    for (const route of routes) {
        if (route.method === req.method && url.pathname.startsWith(route.path.replace("/:id", ""))) {
            return route.handler(req);
        }
    }

    return new Response(
        JSON.stringify(jsonResponse("Not Found", 404)),
        { status: 404 }
    );
}

console.log("Server listening on http://localhost:3000");
