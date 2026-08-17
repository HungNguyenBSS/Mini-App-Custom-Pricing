import { Context } from 'koa';
import { ruleService } from '../services/rule.service.js';

export class RuleController {
  private getShopDomain(ctx: Context): string | null {
    const shopDomain = ctx.state.shopDomain || ctx.get('x-shop-domain') || ctx.query.shopDomain;
    if (!shopDomain) {
      ctx.status = 400;
      ctx.body = { error: 'shopDomain is required' };
      return null;
    }
    return shopDomain as string;
  }

  async getAllRules(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const status = ctx.query.status as string | undefined;
      const rules = await ruleService.getAllRules(shopDomain, status);
      ctx.body = { data: rules };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async getRuleById(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const rule = await ruleService.getRuleById(ctx.params.id, shopDomain);
      if (rule) {
        ctx.body = { data: rule };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Rule not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async createRule(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const data = ctx.request.body as any;
      const newRule = await ruleService.createRule(shopDomain, data);
      ctx.status = 201;
      ctx.body = { data: newRule };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async updateRule(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const data = ctx.request.body as any;
      const rule = await ruleService.updateRule(ctx.params.id, shopDomain, data);
      if (rule) {
        ctx.body = { data: rule };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Rule not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async duplicateRule(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const newRule = await ruleService.duplicateRule(ctx.params.id, shopDomain);
      if (newRule) {
        ctx.status = 201;
        ctx.body = { data: newRule };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Rule not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async deleteRule(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const success = await ruleService.deleteRule(ctx.params.id, shopDomain);
      if (success) {
        ctx.body = { data: { success: true } };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Rule not found' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }

  async bulkDeleteRules(ctx: Context) {
    const shopDomain = this.getShopDomain(ctx);
    if (!shopDomain) return;

    try {
      const { ids } = ctx.request.body as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'An array of ids is required in the request body' };
        return;
      }

      const success = await ruleService.bulkDeleteRules(ids, shopDomain);
      if (success) {
        ctx.body = { data: { success: true } };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'Rules not found or no rules deleted' };
      }
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }
}

export const ruleController = new RuleController();
