import Elysia from "elysia";
import cors from "@elysiajs/cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { consumeOrderUpdates } from "./kafka";
import { Order } from "./models/order";
import { rateLimit } from "./middleware/rateLimit";
import type { IOrder } from "./type";

dotenv.config();

const app = new Elysia();
// Create an HTTP server and pass the Elysia app correctly
const server = http.createServer((req, res) => {
  app.handle(res as any).catch((err) => {
    console.error("Request handling error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  });
});
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust to your frontend's origin in production
    methods: ["GET", "POST"],
  },
});

// Apply middleware
app.use(cors());
app.use(rateLimit());

// Define routes
app.get("/", () => {
  console.log("GET / endpoint hit");
  return "Order Service is running";
});

app.post("/internal/orders", async ({ body }) => {
  console.log("POST /internal/orders endpoint hit", body);
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: (body as IOrder).orderId },
      body as IOrder,
      { upsert: true, new: true }
    );
    return order;
  } catch (err) {
    console.error("Error in POST /internal/orders:", err);
    throw err;
  }
});

// Handle 404 for undefined routes
app.onError(({ code, error, set }) => {
  if (code === "NOT_FOUND") {
    set.status = 404;
    return "Route not found";
  }
  console.error("Server error:", error);
  set.status = 500;
  return "Internal Server Error";
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if MongoDB fails
  });

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Kafka consumer
consumeOrderUpdates(async (order: IOrder) => {
  try {
    await Order.findOneAndUpdate(
      { orderId: order.orderId },
      order,
      { upsert: true }
    );
    io.emit("orderUpdate", { orderId: order.orderId, status: order.status });
  } catch (err) {
    console.error("Error in consumeOrderUpdates:", err);
  }
});

const PORT = process.env.PORT || 3000;

// Log all routes
console.log("Registered routes:");
app.routes.forEach((route) => {
  console.log(`${route.method} ${route.path}`);
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});