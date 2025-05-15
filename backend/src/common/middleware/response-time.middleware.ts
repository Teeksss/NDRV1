import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Record request start time
    const start = process.hrtime();
    
    // Add response header
    res.on('finish', () => {
      const elapsed = process.hrtime(start);
      const elapsedMs = (elapsed[0] * 1000) + (elapsed[1] / 1000000);
      
      // Add response time header (rounded to 2 decimal places)
      res.setHeader('X-Response-Time', `${elapsedMs.toFixed(2)}ms`);
    });
    
    next();
  }
}