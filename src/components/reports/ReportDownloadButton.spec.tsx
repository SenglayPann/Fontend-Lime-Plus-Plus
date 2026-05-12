import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ReportDownloadButton } from "./ReportDownloadButton";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react");

describe("ReportDownloadButton", () => {
  const mockSession = {
    user: { accessToken: "fake-token" },
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    (global as any).URL.createObjectURL = jest.fn();
    (global as any).URL.revokeObjectURL = jest.fn();

    // Mock fetch
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: jest
          .fn()
          .mockReturnValue('attachment; filename="lime_project_report_p1.pdf"'),
      },
      blob: () =>
        Promise.resolve(new Blob(["%PDF-test"], { type: "application/pdf" })),
    });
  });

  it("renders correctly with PDF label", () => {
    render(<ReportDownloadButton projectId="p1" type="project" format="pdf" />);
    expect(screen.getByText("Export PDF")).toBeInTheDocument();
  });

  it("triggers download on click", async () => {
    render(<ReportDownloadButton projectId="p1" type="project" format="pdf" />);
    const button = screen.getByText("Export PDF");

    fireEvent.click(button);

    expect(screen.getByTestId("loader")).toBeInTheDocument(); // Assuming we add a test-id or wait for text change

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reports/projects/p1/pdf"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
        }),
      );
    });
  });
});
