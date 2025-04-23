import mongoose from "mongoose";
import type { IUser } from "../type";

const userSchema = new mongoose.Schema<IUser>({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    fcmToken: {
        type: String,
    },
    notificationPreferences: {
        push: {
            type: Boolean,
            default: true,
        },
        sms: {
            type: Boolean,
            default: true,
        },
        email: {
            type: Boolean,
            default: true,
        },
    },
});

export const User = mongoose.model<IUser>("User", userSchema);