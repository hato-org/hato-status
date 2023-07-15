import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	
	HATO_STATUS: KVNamespace;
};

const servers = [
	{
		name: 'Hato',
		url: 'https://hato.cf',
	},
	{
		name: 'Hato API',
		url: 'https://api.hato.cf',
	},
];

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.get('/', async (c) => {
	return c.json(await c.env.HATO_STATUS.get('status', 'json'));
});

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
			servers.map(async ({ name, url }) => {
				const res = await fetch(url);

				return {
					name,
					ok: res.ok,
					status: res.status,
					statusText: res.statusText,
					body: await res.text(),
				};
			})
		);

		await env.HATO_STATUS.put(
			'status',
			JSON.stringify({ status, updatedAt: new Date(event.timeStamp) })
		);
	},
};
