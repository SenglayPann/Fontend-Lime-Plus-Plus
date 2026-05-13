import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UsersRolesClient } from "./UsersRolesClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("UsersRolesClient", () => {
  it("does not crash when a project membership role is missing", () => {
    render(
      <UsersRolesClient
        users={[
          {
            id: "user-1",
            name: "Test User",
            projectMembers: [
              {
                id: "member-1",
                project: { id: "project-1", name: "Capstone" },
              },
            ],
            userRoles: [],
          },
        ]}
        organizations={[]}
        departments={[]}
        accessToken="token"
        actorRoles={["PROJECT_MANAGER"]}
        actorScopes={{ organizations: [] }}
      />,
    );

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Unknown role - Capstone")).toBeInTheDocument();
  });
});
