import 'express-session';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      authUser?: {
        id: number;
        username: string;
      };
    }
  }

  namespace Express {
    interface User {
      id: number;
      username: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export {};
