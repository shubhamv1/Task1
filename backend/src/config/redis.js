const { createClient } = require('redis');

let pubClient = null;
let subClient = null;

const createRedisClients = async () => {
  const options = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
  };

  if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD;
  }

  pubClient = createClient(options);
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis pub error:', err));
  subClient.on('error', (err) => console.error('Redis sub error:', err));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log('Redis connected');

  return { pubClient, subClient };
};

module.exports = { createRedisClients };
