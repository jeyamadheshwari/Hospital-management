import {Middleware, MiddlewareContext} from '@loopback/rest';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'MY_SECRET'; // Use the same secret as your Auth service

export const authMiddleware: Middleware = async (ctx: MiddlewareContext, next) => {
  const {request} = ctx;
  const authHeader = request.headers.authorization;

  if (!authHeader) throw new Error('No token provided');

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    (request as any).user = decoded; // attach user to request
  } catch (err) {
    throw new Error('Invalid token');
  }

  await next();
};
