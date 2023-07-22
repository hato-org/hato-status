import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { Bindings, Info } from './worker';

export const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.get('/', async (c) => {
	return c.json(await c.env.HATO_STATUS.get('status', 'json'));
});

app
	.get('/info', async (c) => {
		return c.json((await c.env.HATO_STATUS.get('info', 'json')) ?? []);
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

app.get('/history', async (c) => {
	const { id, page } = c.req.query();

	if (!id || !page) throw new HTTPException(400);

	return c.json(
		(await c.env.DB.prepare(
			`SELECT * FROM status_${id} ORDER BY timestamp DESC LIMIT ?1 OFFSET ?2`
		)
			.bind(24, 24 * Number(page))
			.all()).results
	);
});
