import { Hono } from 'hono';
import { Bindings, Info } from './worker';
import { cors } from 'hono/cors';

export const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.get('/', async (c) => {
	return c.json(await c.env.HATO_STATUS.get('status', 'json'));
});

app
	.get('/info', async (c) => {
		return c.json(await c.env.HATO_STATUS.get('info', 'json') ?? []);
	})
	.post(async (c) => {
		const info = await c.env.HATO_STATUS.get<Info[]>('info', 'json');

		return c.json(
			await c.env.HATO_STATUS.put(
				'info',
				JSON.stringify([...(info ?? []), await c.req.json()])
			)
		);
	});
