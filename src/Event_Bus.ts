import Redis from "ioredis";
import { Event_Group } from "./Event_Group";
import { STREAM_NAME } from "./constants";
import type { Event_Bus_Options } from "./types";

export class Event_Bus {
  private redis: Redis;

  constructor(options: Event_Bus_Options) {
    this.redis = new Redis(options.url);
  }

  async group(name: string): Promise<Event_Group> {
    return Event_Group.create(name, this.redis, STREAM_NAME);
  }

  async ping(): Promise<boolean> {
    try {
      const reply = await this.redis.ping();
      return reply === "PONG";
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
