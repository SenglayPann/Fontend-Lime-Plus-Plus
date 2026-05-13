import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      roles: string[];
      scopes?: {
        organizations: Array<{ id: string; name: string; role: string }>;
        departments: Array<{
          id: string;
          name: string;
          role: string;
          organizationId?: string | null;
        }>;
        projects: Array<{
          id: string;
          name: string;
          role: string;
          departmentId?: string | null;
          departmentName?: string | null;
          organizationId?: string | null;
          organizationName?: string | null;
        }>;
      };
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      error?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    roles: string[];
    scopes?: Session["user"]["scopes"];
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    role: string;
    roles: string[];
    scopes?: Session["user"]["scopes"];
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accessTokenExpires: number;
    error?: string;
  }
}
