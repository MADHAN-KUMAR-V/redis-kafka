import { Event_Bus } from "./dist/index.mjs";

const bus = new Event_Bus({ url: "redis://localhost:6379" });

const auth = await bus.group("auth-service");
const mail = await bus.group("mail-service");
const profile = await bus.group("profile-service");

await mail.subscribe("user.registered", async (payload) => {
  console.log("mail received:", payload);
});

await profile.subscribe("user.registered", async (payload) => {
  console.log("profile received:", payload);
});
for (let i = 0; i <= 10; i++) {
  await auth.publish("user.registered", {
    userId: `${i + 1}`,
    email: `john${i + 1}@test.com`,
  });
}
