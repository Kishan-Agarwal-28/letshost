import Redis from "ioredis";
let redis;
const connectRedis = async () => {
  try {
    redis = await new Redis({
      username: process.env.REDIS_UNAME,
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_URI,
      port: process.env.REDIS_PORT,
    });
    console.log("redis connected!!!!!");
  } catch (error) {
    console.log(error);
    console.error("redis connection failed");
    process.exit(0);
  }
};
export { connectRedis, redis };
