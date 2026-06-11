# redis-kafka

Lightweight event bus for Node.js microservices powered by Redis Streams.

## Install

```bash
npm install redis-kafka ioredis
```

## Usage

```typescript
import { EventBus } from "redis-kafka";

const bus = new EventBus({ url: "redis://localhost:6379" });

const auth = await bus.group("auth-service");
const mail = await bus.group("mail-service");
const profile = await bus.group("profile-service");

// Publish
await auth.publish("user.registered", {
  userId: "123",
  email: "john@test.com",
});

// Subscribe (independent fanout per group)
await mail.subscribe("user.registered", async (payload) => {
  console.log("send mail to", payload.email);
});

await profile.subscribe("user.registered", async (payload) => {
  console.log("create profile for", payload.userId);
});
```

## How it works

- Built on **Redis Streams** — no Kafka, no Zookeeper, no extra infra
- Each `bus.group()` creates an independent **Redis Consumer Group**
- All groups receive every published event (Kafka-like fanout)
- Groups are created automatically — no manual setup needed

## Requirements

- Node.js >= 18
- Redis >= 6.2

## License

MIT
