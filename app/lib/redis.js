import { createClient } from 'redis';

export const redis = process.env.REDIS_URL
    ? createClient({ url: process.env.REDIS_URL })
    : null;

if (redis) {
    redis.on('error', (err) => {
        console.error('[redis] connection error:', err.message);
    });
    redis
        .connect()
        .then(() => redis.ping())
        .then((res) => console.log('[redis] connected, PING ->', res))
        .catch((err) => {
            console.error('[redis] startup PING failed:', err.message);
        });
}
