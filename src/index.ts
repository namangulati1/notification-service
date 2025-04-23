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
const server = http.createServer();
const io = new Server(server);

app.use(cors()).use(rateLimit());

app.get("/", () => "Order Service is running");

app.post("/internal/orders", async ({ body }) => {
  const order = await Order.findOneAndUpdate(
    { orderId: (body as IOrder).orderId },
    body as IOrder,
    { upsert: true, new: true }
  );
  return order;
});

mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log("MongoDB connected");
});

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
});

consumeOrderUpdates(async (order: IOrder) => {
  await Order.findOneAndUpdate(
    {
      orderId: order.orderId,
    },
    order,
    { upsert: true }
  );
  io.emit("orderUpdate", { orderId: order.orderId, status: order.status });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
