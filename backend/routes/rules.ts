import Router from '@koa/router';
import { Rule } from '../models/Rule.js';
import { randomUUID } from 'crypto';

export const rulesRouter = new Router();

rulesRouter.get('/', async (ctx) => {
  const rules = await Rule.findAll();
  ctx.body = rules;
});

rulesRouter.get('/:id', async (ctx) => {
  const rule = await Rule.findByPk(ctx.params.id);
  if (rule) {
    ctx.body = rule;
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});

rulesRouter.post('/', async (ctx) => {
  const data = ctx.request.body as any;
  const newRule = await Rule.create({
    id: data.id || randomUUID(),
    ...data,
  });
  ctx.body = newRule;
});

rulesRouter.put('/:id', async (ctx) => {
  const data = ctx.request.body as any;
  const rule = await Rule.findByPk(ctx.params.id);
  if (rule) {
    await rule.update(data);
    ctx.body = rule;
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});

rulesRouter.post('/:id/duplicate', async (ctx) => {
  const rule = await Rule.findByPk(ctx.params.id);
  if (rule) {
    const data = rule.toJSON();
    const newRule = await Rule.create({
      ...data,
      id: randomUUID(),
      name: `${data.name} (copy)`,
      createdAt: new Date(),
    });
    ctx.body = newRule;
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});

rulesRouter.delete('/:id', async (ctx) => {
  const rule = await Rule.findByPk(ctx.params.id);
  if (rule) {
    await rule.destroy();
    ctx.body = { success: true };
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});
