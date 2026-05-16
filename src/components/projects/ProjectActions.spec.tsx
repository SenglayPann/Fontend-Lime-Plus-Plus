import { render, screen } from "@testing-library/react";
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

  it("disables score-changing actions for locked projects", () => {
    render(
      <ProjectActions
        projectId="project-1"
        accessToken="token"
        isLocked
        canLockProject
      />,
    );

    expect(screen.getByRole("button", { name: /sync locked/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /project locked/i }),
    ).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
