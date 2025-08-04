import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// const clerkClient = createClerkClient({
//   publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
//   apiUrl: process.env.CLERK_API_URL,
//   secretKey: process.env.CLERK_SECRET_KEY,
// });
@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Middleware called');
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(401)
          .json({ message: 'Missing or invalid Authorization header' });
      }
      const token = authHeader.split(' ')[1];
      console.log('hiii token', token);
      if (!token) {
        return res
          .status(401)
          .json({ message: 'Token not found. User must sign in.' });
      }

      console.log('jwtKey', process.env.CLERK_JWT_KEY);
      const verifiedToken = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY,
        // authorizedParties: ['http://localhost:3001', 'api.example.com'],
      });
      console.info('Token validation successful:', verifiedToken);
      // Attach sub and email to request (custom property)

      //   const user = await clerkClient.users.getUser(verifiedToken.sub);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (req as any).clerkUser = {
        sub: verifiedToken.sub,
        email: verifiedToken['com.abhiloans.emailAddress'] as string,
      };
      return next();
    } catch (error) {
      console.error('Token validation failed:', error);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
