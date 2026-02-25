import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

export const snapshotQueue = new Queue("holder-snapshot", {
  connection,
  defaultJobOptions: { removeOnComplete: 100 },
});

export function createSnapshotWorker(
  processor: (job: { data: { workspaceId: string } }) => Promise<void>
) {
  return new Worker("holder-snapshot", processor, {
    connection,
    concurrency: 2,
  });
}
