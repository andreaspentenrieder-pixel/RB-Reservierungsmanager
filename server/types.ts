import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    email: string;
    yhIdentifier: string;
    role: string;
    isAdminAuthenticated?: boolean; // True if they provided the admin password
  }
}
