# redis-kafka

Lightweight event bus for Node.js microservices powered by Redis Streams.

No Kafka. No Zookeeper. Just Redis.

## Install

```bash
npm install redis-kafka ioredis
```

## Usage

```typescript
import { Event_Bus } from "redis-kafka";

const bus = new Event_Bus({ url: "redis://localhost:6379" });

// Each service gets its own group — created automatically if it doesn't exist
const auth    = await bus.group("auth-service");
const mail    = await bus.group("mail-service");
const profile = await bus.group("profile-service");

// Publish an event from one service
await auth.publish("user.registered", {
  userId: "123",
  email: "john@test.com",
});

// Every subscriber receives the same event independently
await mail.subscribe("user.registered", async (payload) => {
  console.log("send welcome email to", payload.email);
});

await profile.subscribe("user.registered", async (payload) => {
  console.log("create profile for", payload.userId);
});
```

## How it works

One published event reaches every subscriber independently — just like Kafka, but using Redis Streams under the hood.

- Each `bus.group()` creates a Redis Consumer Group automatically
- All groups read from the same stream and receive every event
- Consumer groups are reused across restarts — no duplicate setup
- Each subscriber runs in its own background polling loop

## TypeScript support

This package ships with full TypeScript types out of the box.

```typescript
import type { Event_Handler, Event_Bus_Options } from "redis-kafka";

const handler: Event_Handler<{ userId: string }> = async (payload) => {
  console.log(payload.userId);
};
```

## Requirements

- Node.js >= 18
- Redis >= 6.2
- ioredis >= 5

## License

MIT
