import Router from '@koa/router';
import { Shop } from '../models/Shop.js';
import { randomUUID } from 'crypto';

export const shopRouter = new Router();

shopRouter.get('/', async (ctx) => {
  const shop = await Shop.findOne();
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
    },
  });

  if (!created) {
    await shop.update({
      accessToken: data.accessToken,
      name: data.name,
    });
  }

  ctx.body = shop;
});

shopRouter.put('/', async (ctx) => {
  const data = ctx.request.body as any;
  let shop = await Shop.findOne();
  if (shop) {
    await shop.update(data);
    ctx.body = shop;
  } else {
    ctx.body = { error: 'Shop not found' };
    ctx.status = 404;
  }
});