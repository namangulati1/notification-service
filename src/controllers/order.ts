import { Order } from "../models/order";
import { publishOrderUpdate } from "../kafka";
import { cacheOrderStatus, getCachedOrderStatus } from "../services/cache";
import type { IOrder, OrderStatus } from "../type";

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  placed: ["shipped"],
  shipped: ["out of delivery"],
  "out of delivery": ["delivered"],
  delivered: [],
};

export const createOrder = async (order: IOrder) => {
  const newOrder = new Order(order);
  await newOrder.save();
  await cacheOrderStatus(order.orderId, order.status);
  await publishOrderUpdate(order);
  return newOrder;
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus
) => {
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error("Order not found");
  if (!validTransitions[order.status].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${newStatus}`
    );
  }
  order.status = newStatus;
  order.updatedAt = new Date();
  await order.save();
  await cacheOrderStatus(orderId, newStatus);
  await publishOrderUpdate(order);
  return order;
};

export const getOrder = async (orderId: string) => {
  const cachedStatus = await getCachedOrderStatus(orderId);
  if (cachedStatus) return { orderId, status: cachedStatus };
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error("Order not found");
  return order;
};
