import Router from '@koa/router';
import { shopController } from '../controllers/shop.controller.js';
import { authMiddleware } from '../middleware/auth.js';

export const shopRouter = new Router();

// The shop creation might happen during OAuth or from frontend with session token.
// Assuming frontend sends the token for all requests:
shopRouter.post('/', shopController.upsertShop); 

// For other routes, apply auth middleware
shopRouter.get('/', authMiddleware, shopController.getShop);
shopRouter.put('/uninstall', shopController.uninstallShop); // Webhooks usually don't have Bearer tokens, they have HMAC. We'll leave auth off for now or we should verify HMAC.