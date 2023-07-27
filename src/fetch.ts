import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { Bindings, Info, servers } from './worker';

export const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.get('/', async (c) => {
	return c.json(await c.env.HATO_STATUS.get('status', 'json'));
});

app.get('/servers', (c) => c.json(servers));

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

	// 既知のID以外のリクエストを拒否 (SQLインジェクションの防止)
	const serverId = servers.find((server) => server.id === id)?.id;

	if (!serverId || !page) throw new HTTPException(400);

	const offset = Number(page) - 1;

	return c.json(
		(
			await c.env.DB.prepare(
				`SELECT * FROM status_${serverId} ORDER BY timestamp DESC LIMIT ?1 OFFSET ?2`
			)
				.bind(24, 24 * offset)
				.all()
		).results
	);
});
