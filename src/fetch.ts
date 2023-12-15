import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Bindings, servers } from './worker';
import { StatusMaintenance } from './types';

export const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.get('/', async (c) => {
	return c.json(await c.env.HATO_STATUS.get('status', 'json'));
});

app.get('/servers', (c) => c.json(servers));

app
	.get('/info', async (c) => {
		return c.json(
			(
				await c.env.HATO_STATUS.get<StatusMaintenance[]>('info', 'json')
			)?.filter(({ endAt }) => Date.now() < new Date(endAt).getTime()) ?? []
		);
	})
	.post(
		zValidator(
			'json',
			z.object({
				type: z.literal('maintenance'),
				title: z.string(),
				description: z.string(),
				startAt: z.string().datetime(),
				endAt: z.string().datetime(),
				scope: z.string().array().nonempty(),
			})
		),
		async (c) => {
			const info = await c.env.HATO_STATUS.get<StatusMaintenance[]>('info', 'json');

			return c.json(
				await c.env.HATO_STATUS.put(
					'info',
					JSON.stringify([...(info ?? []), await c.req.json()])
				)
			);
		}
	);

app.get(
	'/history',
	zValidator(
		'query',
		z.object({
			id: z.string().refine((val) => servers.some(({ id }) => id === val)),
			page: z.string().regex(/^[0-9]+$/),
		})
	),
	async (c) => {
		const { id, page } = c.req.query();

		const offset = Number(page) - 1;

		return c.json(
			(
				await c.env.DB.prepare(
					`SELECT * FROM status_${id} ORDER BY timestamp DESC LIMIT ?1 OFFSET ?2`
				)
					.bind(24, 24 * offset)
					.all()
			).results
		);
	}
);
