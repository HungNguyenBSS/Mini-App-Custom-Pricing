import Router from '@koa/router';
import { Rule } from '../models/Rule.js';
import { randomUUID } from 'crypto';

export const rulesRouter = new Router();

function requireShopDomain(ctx: any): string | null {
  const shopDomain = ctx.get('x-shop-domain') || ctx.query.shopDomain;
  if (!shopDomain) {
    ctx.status = 400;
    ctx.body = { error: 'shopDomain is required' };
    return null;
  }
  return shopDomain;
}

rulesRouter.get('/', async (ctx) => {
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const status = ctx.query.status as string | undefined;
  const where: any = { shopDomain };
  if (status) where.status = status;

  const rules = await Rule.findAll({ where });
  ctx.body = rules;
});

rulesRouter.get('/:id', async (ctx) => {
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const rule = await Rule.findOne({ where: { id: ctx.params.id, shopDomain } });
  if (rule) {
    ctx.body = rule;
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});

rulesRouter.post('/', async (ctx) => {
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const data = ctx.request.body as any;
  const newRule = await Rule.create({
    id: data.id || randomUUID(),
    ...data,
    shopDomain,
  });
  ctx.body = newRule;
});

rulesRouter.put('/:id', async (ctx) => {
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const data = ctx.request.body as any;
  const rule = await Rule.findOne({ where: { id: ctx.params.id, shopDomain } });
  if (rule) {
    await rule.update(data);
    ctx.body = rule;
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});

rulesRouter.post('/:id/duplicate', async (ctx) => {
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const rule = await Rule.findOne({ where: { id: ctx.params.id, shopDomain } });
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
  const shopDomain = requireShopDomain(ctx);
  if (!shopDomain) return;

  const rule = await Rule.findOne({ where: { id: ctx.params.id, shopDomain } });
  if (rule) {
    await rule.destroy();
    ctx.body = { success: true };
  } else {
    ctx.body = { error: 'Rule not found' };
    ctx.status = 404;
  }
});