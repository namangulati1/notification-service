import kafka from 'kafka-node';
import type { IOrder } from '../type';

const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKERS });
const producer = new kafka.Producer(client);
const consumer = new kafka.Consumer(client, [{ topic: 'order-updates', partition: 0 }], { autoCommit: true });

export const publishOrderUpdate = (order: IOrder): Promise<void> => {
  return new Promise((resolve, reject) => {
    const payloads = [{ topic: 'order-updates', messages: JSON.stringify(order) }];
    producer.send(payloads, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const consumeOrderUpdates = (callback: (order: IOrder) => void) => {
  consumer.on('message', (message) => {
    const order = JSON.parse(message.value as string) as IOrder;
    callback(order);
  });
};