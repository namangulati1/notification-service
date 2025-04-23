import mongoose, { Schema } from "mongoose";
import type { IOrder, OrderStatus } from "../type";

const validStatuses: OrderStatus[] = ['placed', 'shipped', 'out of delivery', 'delivered'];
const orderSchema = new Schema<IOrder>({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: validStatuses,
        default: 'placed',
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);