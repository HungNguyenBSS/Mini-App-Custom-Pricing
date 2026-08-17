import Router from '@koa/router';
import { ruleController } from '../controllers/rule.controller.js';
import { authMiddleware } from '../middleware/auth.js';

export const rulesRouter = new Router();

// Apply auth middleware to all rule routes
rulesRouter.use(authMiddleware);

rulesRouter.get('/', (ctx) => ruleController.getAllRules(ctx));
rulesRouter.post('/', (ctx) => ruleController.createRule(ctx));
rulesRouter.post('/bulk-delete', (ctx) => ruleController.bulkDeleteRules(ctx));
rulesRouter.get('/:id', (ctx) => ruleController.getRuleById(ctx));
rulesRouter.put('/:id', (ctx) => ruleController.updateRule(ctx));
rulesRouter.post('/:id/duplicate', (ctx) => ruleController.duplicateRule(ctx));
rulesRouter.delete('/:id', (ctx) => ruleController.deleteRule(ctx));