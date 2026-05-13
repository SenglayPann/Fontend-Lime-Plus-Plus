import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

function mockSession(user: any) {
  (useSession as jest.Mock).mockReturnValue({
    data: { user },
  });
}

describe("Sidebar role visibility", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/my-contributions");
  });

  it("shows only personal navigation for an unassigned GitHub user", () => {
    mockSession({
      roles: ["USER"],
      scopes: { organizations: [], departments: [], projects: [] },
    });

    render(<Sidebar />);

    expect(screen.getByText("My Contributions")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
    expect(screen.queryByText("Users & Roles")).not.toBeInTheDocument();
  });

  it("shows projects but not management navigation for a project member", () => {
    mockSession({
      roles: ["PROJECT_MEMBER"],
      scopes: {
        organizations: [],
        departments: [],
        projects: [{ id: "project-1", role: "PROJECT_MEMBER" }],
      },
    });

    render(<Sidebar />);

    expect(screen.getByText("My Contributions")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users & Roles")).not.toBeInTheDocument();
  });

  it("labels user visibility as Users for a project manager", () => {
    mockSession({
      roles: ["PROJECT_MANAGER"],
      scopes: {
        organizations: [],
        departments: [],
        projects: [{ id: "project-1", role: "PROJECT_MANAGER" }],
      },
    });

    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.queryByText("Users & Roles")).not.toBeInTheDocument();
  });

  it("shows scoped management navigation for an organization manager", () => {
    mockSession({
      roles: ["ORGANIZATION_MANAGER"],
      scopes: {
        organizations: [{ id: "org-1", role: "ORGANIZATION_MANAGER" }],
        departments: [],
        projects: [],
      },
    });

    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Departments")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Users & Roles")).toBeInTheDocument();
  });
});
