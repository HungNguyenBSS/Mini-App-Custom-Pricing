import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { shopRouter } from './routes/shop.js';
import { rulesRouter } from './routes/rules.js';
import { sequelize } from './models/index.js';

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors());
app.use(bodyParser());

// Routes
router.use('/api/shop', shopRouter.routes(), shopRouter.allowedMethods());
router.use('/api/rules', rulesRouter.routes(), rulesRouter.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3001;

// Database connection & sync
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to sync db: ', err);
});
