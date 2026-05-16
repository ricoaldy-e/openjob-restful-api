const amqplib = require('amqplib');

const ProducerService = {
  async sendMessage(queue, message) {
    const connection = await amqplib.connect({
      hostname: process.env.RABBITMQ_HOST || 'localhost',
      port: process.env.RABBITMQ_PORT || 5672,
      username: process.env.RABBITMQ_USER || 'guest',
      password: process.env.RABBITMQ_PASSWORD || 'guest',
    });
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

    setTimeout(() => connection.close(), 1000);
  },
};

module.exports = ProducerService;
