import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
        expiresIn: { label: "Expires In", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.refreshToken) {
          return null;
        }

        // Decode the access token (JWT) to get user info if possible,
        // or fetch from backend /me endpoint.
        // For now, we trust the tokens passed from the callback page
        // and fetch user details from backend to confirm validity.

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${credentials.accessToken}`,
              },
            },
          );

          if (!res.ok) {
            return null;
          }

          const json = await res.json();
          const user = json.success ? json.data : null;

          if (!user) {
            return null;
          }

          // Return user object compatible with our extended User type
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.roles?.[0] || "USER",
            roles:
              Array.isArray(user.roles) && user.roles.length > 0
                ? user.roles
                : ["USER"],
            scopes: user.scopes,
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            expiresIn: parseInt(credentials.expiresIn || "900", 10),
          };
        } catch (error) {
          console.error("Error authorizing user:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          roles: user.roles,
          scopes: user.scopes,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresIn: user.expiresIn,
          accessTokenExpires: Date.now() + user.expiresIn * 1000,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.roles = (token.roles as string[]) || [session.user.role];
      session.user.scopes = token.scopes as typeof session.user.scopes;
      session.user.accessToken = token.accessToken as string;
      session.user.refreshToken = token.refreshToken as string;
      session.user.expiresIn = token.expiresIn as number;
      session.user.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  session: {
    strategy: "jwt",
  },
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: token.refreshToken,
        }),
      },
    );

    const json = await response.json();
    const refreshedTokens = json.success ? json.data : null;

    if (!response.ok) {
      throw refreshedTokens;
    }

    const profileResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${refreshedTokens.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const profileJson = await profileResponse.json();
    const user = profileJson.success ? profileJson.data : null;

    if (!profileResponse.ok || !user) {
      throw user;
    }

    return {
      ...token,
      id: user.id,
      role: user.roles?.[0] || "USER",
      roles:
        Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles
          : ["USER"],
      scopes: user.scopes,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
      expiresIn: refreshedTokens.expiresIn,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fall back to old refresh token
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
