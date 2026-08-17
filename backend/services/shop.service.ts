import { Shop } from '../models/Shop.js';

export class ShopService {
  async getShopByDomain(shopDomain: string) {
    const shop = await Shop.findOne({ where: { shopDomain } });
    if (!shop) return null;

    // Return shop details excluding the access token
    return {
      id: shop.id,
      shopDomain: shop.shopDomain,
      name: shop.name,
      status: (shop as any).status,
    };
  }

  async upsertShop(data: { shopDomain: string; accessToken: string; name?: string; status?: string }) {
    const [shop, created] = await Shop.findOrCreate({
      where: { shopDomain: data.shopDomain },
      defaults: {
        shopDomain: data.shopDomain,
        accessToken: data.accessToken,
        name: data.name,
        status: data.status || 'active',
      } as any,
    });

    if (!created) {
      await shop.update({
        accessToken: data.accessToken,
        name: data.name,
        status: data.status || 'active',
      } as any);
    }

    return this.getShopByDomain(shop.shopDomain);
  }

  async uninstallShop(shopDomain: string) {
    const shop = await Shop.findOne({ where: { shopDomain } });
    if (!shop) return null;

    await shop.update({ status: 'uninstalled' } as any);
    return this.getShopByDomain(shopDomain);
  }
}

export const shopService = new ShopService();
