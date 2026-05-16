import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ProjectTasksClient } from "./ProjectTasksClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("ProjectTasksClient", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("keeps Kanban sync disabled after project lock", () => {
    render(
      <ProjectTasksClient
        projectId="project-1"
        accessToken="token"
        repository="lime/example"
        initialTasks={[]}
        canSync
        isProjectWide
        isLocked
      />,
    );

    expect(screen.getByRole("button", { name: /sync locked/i })).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("lets project managers reassign tasks to project members", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: "task-1" } }),
    });

    render(
      <ProjectTasksClient
        projectId="project-1"
        accessToken="token"
        repository="lime/example"
        initialTasks={[
          {
            id: "task-1",
            externalTaskId: "TASK-1",
            title: "Wire up auth",
            status: "TODO",
            assigneeId: "user-1",
            assignee: { id: "user-1", name: "Ada Lovelace" },
          },
        ]}
        projectMembers={[
          { userId: "user-1", user: { name: "Ada Lovelace" } },
          { userId: "user-2", user: { name: "Grace Hopper" } },
        ]}
        canSync
        canAssignTasks
        isProjectWide
      />,
    );

    await user.selectOptions(screen.getByLabelText("Assign Wire up auth"), [
      "user-2",
    ]);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/tasks/task-1/assign",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ assignee_id: "user-2" }),
      }),
    );
  });
});
