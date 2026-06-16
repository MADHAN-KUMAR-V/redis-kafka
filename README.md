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

## Stream trimming

By default the Redis stream grows without limit. Set `maxlen` to automatically
keep only the last N messages and prevent memory growth.

```typescript
const bus = new Event_Bus({
  url: "redis://localhost:6379",
  maxlen: 10_000,
});
```

Oldest messages are trimmed automatically on each publish once the stream
exceeds `maxlen`. This is an approximate trim — Redis may keep slightly more
than `maxlen` for performance.

## Health check

Use `ping()` to verify the Redis connection is alive before your app starts
accepting traffic.

```typescript
const ok = await bus.ping();

if (!ok) {
  console.error("Redis is not reachable");
  process.exit(1);
}
```

## Clean shutdown

Call `disconnect()` when your app is shutting down so the Redis connection
closes cleanly and the process exits.

```typescript
process.on("SIGTERM", async () => {
  await bus.disconnect();
  process.exit(0);
});
```

## How it works

One published event reaches every subscriber independently — just like Kafka,
but using Redis Streams under the hood.

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

## API

### `new Event_Bus(options)`

| Option | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | Redis connection URL |
| `maxlen` | `number` | No | Max messages in stream. Oldest trimmed automatically. |

### `bus.group(name)`

Creates or reuses a Redis Consumer Group. Returns an `Event_Group`.

### `bus.ping()`

Returns `true` if Redis is reachable, `false` if not.

### `bus.disconnect()`

Closes the Redis connection cleanly.

### `group.publish(event, payload)`

Sends an event into the stream. All subscriber groups receive it independently.

### `group.subscribe(event, handler)`

Starts listening for a specific event in the background. Handler is called for
every matching message.

## Requirements

- Node.js >= 18
- Redis >= 6.2
- ioredis >= 5

## License

MIT
