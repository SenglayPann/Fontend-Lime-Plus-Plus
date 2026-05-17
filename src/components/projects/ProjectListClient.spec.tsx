import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ProjectListClient } from "./ProjectListClient";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("ProjectListClient", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("filters projects by search text", async () => {
    const user = userEvent.setup();

    render(
      <ProjectListClient
        canCreateProject
        initialProjects={[
          {
            id: "project-1",
            name: "Capstone",
            repository: "school/capstone",
            status: "ACTIVE",
            department: { name: "Computer Science" },
            _count: { members: 3 },
          },
          {
            id: "project-2",
            name: "Design Lab",
            repository: "school/design",
            status: "LOCKED",
            department: { name: "Arts" },
            _count: { members: 2 },
          },
        ]}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search projects..."), "computer");

    await waitFor(() => {
      expect(screen.getByText("Capstone")).toBeInTheDocument();
      expect(screen.queryByText("Design Lab")).not.toBeInTheDocument();
    });
  });
});
