import { Elysia } from 'elysia';
import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL,
});

client.connect();

export const rateLimit = () => {
    return new Elysia().onBeforeHandle(async ({ request, set }) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const key = `rate-limit:${ip}`;
        const count = await client.incr(key);

        if (count === 1) {
            await client.expire(key, Number(process.env.RATE_LIMIT_WINDOW_MS) / 1000);
        }

        if(count > Number(process.env.RATE_LIMIT_MAX)) {
            set.status = 429;
            return 'Too many requests';
        }
    });
};