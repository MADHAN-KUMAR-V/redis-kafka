import type Redis from "ioredis";
import type {
  Event_Handler,
  Publish_Options,
  Subscribe_Options,
} from "./types";
import { BLOCK_MS, COUNT } from "./constants";

export class Event_Group {
  private constructor(
    private name: string,
    private redis: Redis,
    private stream: string,
  ) {}

  static async create(
    name: string,
    redis: Redis,
    stream: string,
  ): Promise<Event_Group> {
    try {
      await redis.xgroup("CREATE", stream, name, "$", "MKSTREAM");
    } catch (err: unknown) {
      if (!(err instanceof Error && err.message.includes("BUSYGROUP")))
        throw err;
    }
    return new Event_Group(name, redis, stream);
  }

  async publish(
    event: string,
    payload: unknown,
    _options?: Publish_Options,
  ): Promise<void> {
    await this.redis.xadd(
      this.stream,
      "*",
      "event",
      event,
      "payload",
      JSON.stringify(payload),
      "timestamp",
      Date.now().toString(),
    );
  }

  async subscribe<T = unknown>(
    event: string,
    handler: Event_Handler<T>,
    _options?: Subscribe_Options,
  ): Promise<void> {
    const consumer = `${this.name}-${process.pid}`;

    const poll = async () => {
      while (true) {
        const results = (await this.redis.xreadgroup(
          "GROUP",
          this.name,
          consumer,
          "COUNT",
          COUNT,
          "BLOCK",
          BLOCK_MS,
          "STREAMS",
          this.stream,
          ">",
        )) as [string, [string, string[]][]][] | null;

        if (!results) continue;

        for (const [, messages] of results) {
          for (const [id, fields] of messages) {
            const msg_event = fields[fields.indexOf("event") + 1];
            const msg_payload = JSON.parse(
              fields[fields.indexOf("payload") + 1],
            );

            if (msg_event === event) {
              await handler(msg_payload as T);
            }

            await this.redis.xack(this.stream, this.name, id);
          }
        }
      }
    };

    poll().catch(console.error);
  }
}
