import Router from '@koa/router';
import { Shop } from '../models/Shop.js';
import { randomUUID } from 'crypto';

export const shopRouter = new Router();

shopRouter.get('/', async (ctx) => {
  const shop = await Shop.findOne();
  if (shop) {
    ctx.body = shop;
  } else {
    // If no shop, return a default mock for now or error
    ctx.body = { error: 'Shop not found' };
    ctx.status = 404;
  }
});

shopRouter.post('/', async (ctx) => {
  const data = ctx.request.body as any;
  const newShop = await Shop.create({
    id: data.id || randomUUID(),
    shopDomain: data.shopDomain,
    name: data.name,
    senderEmail: data.senderEmail,
    senderEmailEnabled: data.senderEmailEnabled || false,
  });
  ctx.body = newShop;
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
