import { app } from './fetch';

export type Bindings = {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;

	HATO_STATUS: KVNamespace;

	// Example binding to a D1 Database. Learn more at https://developers.cloudflare.com/workers/platform/bindings/#d1-database-bindings
	// DB: D1Database

	DB: D1Database;
};

export const servers = [
	{
		id: 'hato',
		name: 'Hato',
		url: 'https://hato.cf',
	},
	{
		id: 'hato_api',
		name: 'Hato API',
		url: 'https://api.hato.cf',
	},
];

export default {
	fetch: app.fetch,
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(
		event: ScheduledEvent,
		env: Bindings,
		ctx: ExecutionContext
	): Promise<void> {
		// A Cron Trigger can make requests to other endpoints on the Internet,
		// publish to a Queue, query a D1 Database, and much more.

		const status = await Promise.all(
			servers.map(async ({ id, name, url }) => {
				const start = Date.now();
				const res = await fetch(url);

				return {
					id,
					name,
					ok: res.ok,
					status: res.status,
					statusText: res.statusText,
					body: await res.text(),
					time: Date.now() - start,
				};
			})
		);

		// Store status data to KV
		await env.HATO_STATUS.put(
			'status',
			JSON.stringify({
				status,
				updatedAt: new Date(event.scheduledTime).toISOString(),
			})
		);

		// Add status data to history (only HH:00)
		if (!new Date(event.scheduledTime).getMinutes())
			await Promise.all(
				status.map(async ({ id, status, statusText, time, ok }) =>
					await env.DB.prepare(
						`INSERT INTO status_${id} (status, statusText, responseTime, ok, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)`
					)
						.bind(status, statusText, time, ok ? 1 : 0, event.scheduledTime)
						.all()
				)
			);
	},
};
