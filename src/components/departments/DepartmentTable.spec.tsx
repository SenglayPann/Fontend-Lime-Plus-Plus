import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { DepartmentTable } from "./DepartmentTable";

const mockRefresh = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/departments",
  useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("DepartmentTable", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    global.fetch = jest.fn();
    mockRefresh.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders assigned department managers", () => {
    render(
      <DepartmentTable
        accessToken="token"
        initialDepartments={[
          {
            id: "dept-1",
            name: "Computer Science",
            organization: { name: "Engineering" },
            _count: { projects: 2 },
            userRoles: [
              {
                role: "DEPARTMENT_MANAGER",
                user: { name: "Ada Lovelace" },
              },
            ],
          },
        ]}
        canManageDepartments
      />,
    );

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("filters departments by search text", async () => {
    const user = userEvent.setup();

    render(
      <DepartmentTable
        accessToken="token"
        initialDepartments={[
          {
            id: "dept-1",
            name: "Computer Science",
            description: "Algorithms and systems",
            organization: { name: "Engineering" },
            _count: { projects: 2 },
            userRoles: [],
          },
          {
            id: "dept-2",
            name: "Industrial Design",
            description: "Studio",
            organization: { name: "Arts" },
            _count: { projects: 0 },
            userRoles: [],
          },
        ]}
        canManageDepartments
      />,
    );

    await user.type(screen.getByPlaceholderText("Filter departments..."), "systems");

    await waitFor(() => {
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
      expect(screen.queryByText("Industrial Design")).not.toBeInTheDocument();
    });
  });

  it("lets department managers edit department details", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "dept-1",
          name: "Software Engineering",
          description: "Updated description",
        },
      }),
    });

    render(
      <DepartmentTable
        accessToken="token"
        initialDepartments={[
          {
            id: "dept-1",
            name: "Computer Science",
            description: "Original description",
            organization: { name: "Engineering" },
            _count: { projects: 0 },
            userRoles: [
              {
                role: "DEPARTMENT_MANAGER",
                user: { id: "manager-1", name: "Ada Lovelace" },
              },
            ],
          },
        ]}
        canManageDepartments
      />,
    );

    await user.click(
      screen.getByLabelText("Open department actions for Computer Science"),
    );
    await user.click(await screen.findByText("Edit"));

    expect(screen.getByLabelText("Department Manager")).toHaveValue(
      "manager-1",
    );
    expect(screen.getByLabelText("Department Manager")).toBeDisabled();
    expect(screen.getByText("Ada Lovelace (Assigned)")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Software Engineering");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(
      screen.getByLabelText("Description"),
      "Updated description",
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/departments/dept-1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "Software Engineering",
          description: "Updated description",
        }),
      }),
    );
    expect(await screen.findByText("Software Engineering")).toBeInTheDocument();
  });

  it("can expose department edit without delete", async () => {
    const user = userEvent.setup();

    render(
      <DepartmentTable
        accessToken="token"
        initialDepartments={[
          {
            id: "dept-1",
            name: "Computer Science",
            organization: { name: "Engineering" },
            _count: { projects: 1 },
            userRoles: [],
          },
        ]}
        canManageDepartments
        canDeleteDepartments={false}
      />,
    );

    await user.click(
      screen.getByLabelText("Open department actions for Computer Science"),
    );

    expect(await screen.findByText("Edit")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("lets authorized managers edit department organization and add a department manager", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "dept-1",
          name: "Software Engineering",
          description: "Updated description",
          organizationId: "org-2",
          organization: { id: "org-2", name: "Science" },
          userRoles: [
            {
              role: "DEPARTMENT_MANAGER",
              user: { id: "user-2", name: "Grace Hopper" },
            },
          ],
          _count: { projects: 0 },
        },
      }),
    });

    render(
      <DepartmentTable
        accessToken="token"
        initialDepartments={[
          {
            id: "dept-1",
            name: "Computer Science",
            description: "Original description",
            organizationId: "org-1",
            organization: { id: "org-1", name: "Engineering" },
            _count: { projects: 0 },
            userRoles: [],
          },
        ]}
        canManageDepartments
        canChangeDepartmentOrganization
        canAssignDepartmentManager
        organizations={[
          { id: "org-1", name: "Engineering" },
          { id: "org-2", name: "Science" },
        ]}
        managerCandidates={[
          {
            id: "user-2",
            name: "Grace Hopper",
            userRoles: [{ role: "PROJECT_MEMBER", organizationId: "org-2" }],
          },
        ]}
        actorRoles={["ADMIN"]}
        actorUserId="admin"
      />,
    );

    await user.click(
      screen.getByLabelText("Open department actions for Computer Science"),
    );
    await user.click(await screen.findByText("Edit"));

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Software Engineering");
    await user.selectOptions(screen.getByLabelText("Organization"), ["org-2"]);
    await user.selectOptions(screen.getByLabelText("Department Manager"), [
      "user-2",
    ]);
    await user.clear(screen.getByLabelText("Description"));
    await user.type(
      screen.getByLabelText("Description"),
      "Updated description",
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/departments/dept-1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "Software Engineering",
          description: "Updated description",
          organization_id: "org-2",
          manager_user_id: "user-2",
        }),
      }),
    );
    expect(await screen.findByText("Software Engineering")).toBeInTheDocument();
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
  });
});
