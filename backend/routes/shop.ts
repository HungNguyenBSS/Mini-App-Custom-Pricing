import Router from '@koa/router';
import { Shop } from '../models/Shop.js';
import { randomUUID } from 'crypto';

export const shopRouter = new Router();

shopRouter.get('/', async (ctx) => {
  const shopDomain = ctx.query.shopDomain as string | undefined;
  if (!shopDomain) {
    ctx.status = 400;
    ctx.body = { error: 'shopDomain query param is required' };
    return;
  }
  const shop = await Shop.findOne({ where: { shopDomain } });
  if (shop) {
    ctx.body = shop;
  } else {
    ctx.body = { error: 'Shop not found' };
    ctx.status = 404;
  }
});

shopRouter.post('/', async (ctx) => {
  const data = ctx.request.body as any;

  const [shop, created] = await Shop.findOrCreate({
    where: { shopDomain: data.shopDomain },
    defaults: {
      id: randomUUID(),
      shopDomain: data.shopDomain,
      accessToken: data.accessToken,
      name: data.name,
      status: data.status || 'active',
    },
  });

  if (!created) {
    await shop.update({
      accessToken: data.accessToken,
      name: data.name,
      status: data.status || 'active',
    });
  }

  ctx.body = shop;
});
shopRouter.put('/uninstall', async (ctx) => {
  const shopDomain = ctx.get('x-shop-domain');
  if (!shopDomain) {
    ctx.status = 400;
    ctx.body = { error: 'shopDomain is required' };
    return;
  }
  const shop = await Shop.findOne({ where: { shopDomain } });
  if (shop) {
    await shop.update({ status: 'uninstalled' });
    ctx.body = shop;
  } else {
    ctx.body = { error: 'Shop not found' };
    ctx.status = 404;
  }
});