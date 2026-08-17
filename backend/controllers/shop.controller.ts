import { Context } from 'koa';
import { shopService } from '../services/shop.service.js';

export class ShopController {
  async getShop(ctx: Context) {
    const shopDomain = ctx.query.shopDomain as string || ctx.state.shopDomain;
    if (!shopDomain) {
      ctx.status = 400;
      ctx.body = { error: 'shopDomain query param is required' };
      return;
    }

    try {
      const shop = await shopService.getShopByDomain(shopDomain);
      if (shop) {
        ctx.body = { data: shop };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Shop not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async upsertShop(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.shopDomain || !data.accessToken) {
      ctx.status = 400;
      ctx.body = { error: 'shopDomain and accessToken are required' };
      return;
    }

    try {
      const shop = await shopService.upsertShop(data);
      ctx.body = { data: shop };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async uninstallShop(ctx: Context) {
    const shopDomain = ctx.get('x-shop-domain') || ctx.state.shopDomain;
    if (!shopDomain) {
      ctx.status = 400;
      ctx.body = { error: 'shopDomain is required' };
      return;
    }

    try {
      const shop = await shopService.uninstallShop(shopDomain);
      if (shop) {
        ctx.body = { data: shop };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Shop not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }
}

export const shopController = new ShopController();
