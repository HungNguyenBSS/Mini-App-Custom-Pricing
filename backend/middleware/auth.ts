import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Missing or invalid token' };
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || process.env.SHOPIFY_API_SECRET || 'fallback-secret';

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret, { clockTolerance: 60 });
    } catch (err) {
      if (!process.env.SHOPIFY_API_SECRET && !process.env.JWT_SECRET) {
        console.warn('⚠️ WARNING: Missing JWT_SECRET or SHOPIFY_API_SECRET. Decoding token without signature verification. Use only in local development!');
        decoded = jwt.decode(token);
        if (!decoded) throw err;
      } else {
        throw err;
      }
    }
    
    // Shopify session token uses 'dest' like 'https://shop-domain.myshopify.com'
    // Or our custom JWT might just have { shopDomain: '...' }
    let shopDomain = decoded.shopDomain;
    
    if (!shopDomain && decoded.dest) {
      shopDomain = decoded.dest.replace('https://', '');
    }

    if (!shopDomain) {
      throw new Error('shopDomain not found in token payload');
    }

    ctx.state.shopDomain = shopDomain;
    await next();
  } catch (error) {
    console.error('JWT Verification error:', error);
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Invalid token' };
  }
};
