import { createClient } from "redis";

const client = createClient({
    url: process.env.REDIS_URL,
});

client.connect();

export const cacheOrderStatus = async (orderId: string, status: string) => {
    await client.setEx(`order:${orderId}`, 3600, status);
};

export const getCachedOrderStatus = async (orderId: string): Promise<string | null> => {
    return await client.get(`order:${orderId}`);
}