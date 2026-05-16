import type { DefaultSession, Session } from "next-auth";

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
      browserId?: string;
      error?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    roles: string[];
    scopes?: {
      organizations: { id: string; role: string }[];
      departments: { id: string; role: string }[];
      projects: { id: string; role: string }[];
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    browserId?: string;
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
    browserId?: string;
    error?: string;
  }
}
