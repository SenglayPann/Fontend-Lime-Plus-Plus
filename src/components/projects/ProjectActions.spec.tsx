import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ProjectActions } from "./ProjectActions";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("ProjectActions", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("disables score-changing actions for locked projects", async () => {
    const user = userEvent.setup();
    render(
      <ProjectActions
        projectId="project-1"
        accessToken="token"
        isLocked
        canLockProject
      />,
    );

    expect(
      screen.getByRole("button", { name: /project locked/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /project actions/i }));
    const reconcileItem = await screen.findByRole("menuitem", {
      name: /sync locked/i,
    });
    expect(reconcileItem).toHaveAttribute("aria-disabled", "true");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
