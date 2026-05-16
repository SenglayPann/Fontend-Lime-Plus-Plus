import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { OrganizationsTableClient } from "./OrganizationsTableClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("OrganizationsTableClient", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders assigned organization managers", () => {
    render(
      <OrganizationsTableClient
        accessToken="token"
        canManageOrganizations
        organizations={[
          {
            id: "org-1",
            name: "Engineering",
            licensePlan: "academic",
            _count: { departments: 1, userRoles: 1 },
            userRoles: [
              {
                role: "ORGANIZATION_MANAGER",
                user: { name: "Grace Hopper" },
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  it("lets admins edit organization fields and add an organization manager", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "org-1",
          name: "Engineering Updated",
          licensePlan: "enterprise",
          userRoles: [
            {
              role: "ORGANIZATION_MANAGER",
              user: { id: "user-2", name: "Ada Lovelace" },
            },
          ],
        },
      }),
    });

    render(
      <OrganizationsTableClient
        accessToken="token"
        canManageOrganizations
        managerCandidates={[{ id: "user-2", label: "Ada Lovelace" }]}
        organizations={[
          {
            id: "org-1",
            name: "Engineering",
            licensePlan: "academic",
            _count: { departments: 1, userRoles: 0 },
            userRoles: [],
          },
        ]}
      />,
    );

    await user.click(
      screen.getByLabelText("Open organization actions for Engineering"),
    );
    await user.click(await screen.findByText("Edit"));

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Engineering Updated");
    await user.selectOptions(screen.getByLabelText("License Plan"), [
      "enterprise",
    ]);
    await user.selectOptions(screen.getByLabelText("Organization Manager"), [
      "user-2",
    ]);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/organizations/org-1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "Engineering Updated",
          license_plan: "enterprise",
          manager_user_id: "user-2",
        }),
      }),
    );
    expect(await screen.findByText("Engineering Updated")).toBeInTheDocument();
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows the assigned organization manager when editing", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "org-1",
          name: "Engineering Updated",
          licensePlan: "academic",
          userRoles: [
            {
              role: "ORGANIZATION_MANAGER",
              user: { id: "user-1", name: "Grace Hopper" },
            },
          ],
        },
      }),
    });

    render(
      <OrganizationsTableClient
        accessToken="token"
        canManageOrganizations
        managerCandidates={[{ id: "user-2", label: "Ada Lovelace" }]}
        organizations={[
          {
            id: "org-1",
            name: "Engineering",
            licensePlan: "academic",
            _count: { departments: 1, userRoles: 1 },
            userRoles: [
              {
                role: "ORGANIZATION_MANAGER",
                user: { id: "user-1", name: "Grace Hopper" },
              },
            ],
          },
        ]}
      />,
    );

    await user.click(
      screen.getByLabelText("Open organization actions for Engineering"),
    );
    await user.click(await screen.findByText("Edit"));

    expect(screen.getByLabelText("Organization Manager")).toHaveValue("user-1");
    expect(screen.getByText("Grace Hopper (Assigned)")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Engineering Updated");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/organizations/org-1",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Engineering Updated",
          license_plan: "academic",
          manager_user_id: undefined,
        }),
      }),
    );
  });
});
