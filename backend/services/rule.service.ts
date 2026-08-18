import { Rule } from '../models/Rule.js';

export class RuleService {
  async getAllRules(shopDomain: string, status?: string) {
    const where: any = { shopDomain };
    if (status) where.status = status;
    return await Rule.findAll({ where });
  }

  async getRuleById(id: string, shopDomain: string) {
    return await Rule.findOne({ where: { id, shopDomain } });
  }

  async createRule(shopDomain: string, data: any) {
    const { id, createdAt, updatedAt, ...safeData } = data;
    return await Rule.create({
      ...safeData,
      shopDomain,
    });
  }

  async updateRule(id: string, shopDomain: string, data: any) {
    const rule = await this.getRuleById(id, shopDomain);
    if (!rule) return null;
    await rule.update(data);
    return rule;
  }

  async duplicateRule(id: string, shopDomain: string) {
    const rule = await this.getRuleById(id, shopDomain);
    if (!rule) return null;

    const data = rule.toJSON();
    delete data.id; // allow UUID to auto-generate
    return await Rule.create({
      ...data,
      name: `${data.name} (copy)`,
      createdAt: new Date(),
    });
  }

  async deleteRule(id: string, shopDomain: string) {
    const rule = await this.getRuleById(id, shopDomain);
    if (!rule) return false;

    await rule.destroy();
    return true;
  }

  async bulkDeleteRules(ids: string[], shopDomain: string) {
    const deletedCount = await Rule.destroy({
      where: {
        id: ids,
        shopDomain,
      },
    });
    return deletedCount > 0;
  }
}

export const ruleService = new RuleService();
