import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      monitorStateIntervalMinutes: 10,
    });

    boss.on('error', (error) => {
      console.error('pg-boss error:', error);
    });

    await boss.start();
  }
  return boss;
}

export async function scheduleJob(type: string, payload: any, options?: { delay?: number; priority?: number }) {
  const queue = await getJobQueue();
  return queue.send(type, payload, {
    retryLimit: 3,
    retryDelay: 60,
    expireInSeconds: 600,
    ...(options?.delay ? { startAfter: options.delay } : {}),
    ...(options?.priority ? { priority: options.priority } : {}),
  });
}
