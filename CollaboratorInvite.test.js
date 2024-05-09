import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollaboratorInvite from "./CollaboratorInvite";
import "@testing-library/jest-dom";

const mockOnClose = jest.fn();
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("CollaboratorInvite Component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders the component successfully", () => {
    render(<CollaboratorInvite pinId="123" onClose={mockOnClose} />);
    expect(screen.getByText("Invite a Collaborator")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Collaborator's Username")
    ).toBeInTheDocument();
    expect(screen.getByText("Invite")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("handles successful collaborator invitation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Success" }),
    });
    render(<CollaboratorInvite pinId="123" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Collaborator's Username");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: /Invite/i }));

    await waitFor(() =>
      expect(
        screen.getByText("Collaborator invited successfully")
      ).toBeInTheDocument()
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles failed collaborator invitation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Failed" }),
    });

    render(<CollaboratorInvite pinId="123" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Collaborator's Username");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: /Invite/i }));

    expect(
      await screen.findByText("Failed to invite collaborator")
    ).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test("cancels the invitation process", () => {
    render(<CollaboratorInvite pinId="123" onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
