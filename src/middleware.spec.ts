jest.mock("next-auth/middleware", () => ({
  withAuth: jest.fn((options) => options),
}));

import { withAuth } from "next-auth/middleware";
import middleware from "./middleware";

describe("middleware authorization", () => {
  const options = middleware as unknown as {
    callbacks: {
      authorized: (params: { token: unknown }) => boolean;
    };
  };

  it("allows valid authenticated tokens", () => {
    expect(options.callbacks.authorized({ token: { sub: "user-1" } })).toBe(
      true,
    );
  });

  it("rejects missing tokens", () => {
    expect(options.callbacks.authorized({ token: null })).toBe(false);
  });

  it("rejects tokens with refresh errors", () => {
    expect(
      options.callbacks.authorized({
        token: { sub: "user-1", error: "RefreshAccessTokenError" },
      }),
    ).toBe(false);
  });

  it("registers middleware through next-auth", () => {
    expect(withAuth).toHaveBeenCalledTimes(1);
  });
});
