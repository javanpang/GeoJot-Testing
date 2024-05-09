import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import ProfilePicture from "./ProfilePicture";

jest.mock("axios");

describe("ProfilePicture", () => {
  const mockOnClose = jest.fn();
  const mockOnProfilePicUpdate = jest.fn();
  const username = "john";
  const currentProfilePic = {
    profilePicUrl: "http://example.com/current-pic.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should display current profile picture if provided", () => {
    render(
      <ProfilePicture
        username={username}
        onClose={mockOnClose}
        currentProfilePic={currentProfilePic}
        onProfilePicUpdate={mockOnProfilePicUpdate}
      />
    );
    expect(screen.getByAltText("Current Profile")).toHaveAttribute(
      "src",
      "http://example.com/current-pic.jpg"
    );
  });

//   test('should display "No current profile picture." when no current picture is provided', () => {
//     render(
//       <ProfilePicture
//         username={username}
//         onClose={mockOnClose}
//         onProfilePicUpdate={mockOnProfilePicUpdate}
//       />
//     );
//     expect(screen.getByText("No current profile picture.")).toBeInTheDocument();
//   });

  it("allows a user to select a new picture and displays it", async () => {
    const file = new File(["example image"], "example.png", {
      type: "image/png",
    });
    render(
      <ProfilePicture
        username={username}
        onClose={mockOnClose}
        currentProfilePic={currentProfilePic}
        onProfilePicUpdate={mockOnProfilePicUpdate}
      />
    );

    const fileInput = screen.getByTestId("upload-image");

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(screen.getByAltText("Profile")).toBeInTheDocument()
    );
  });

  it("handles form submission correctly with an image", async () => {
    const file = new File(["example image"], "example.png", {
      type: "image/png",
    });
    axios.put.mockResolvedValue({
      data: { profilePic: "http://example.com/new-pic.jpg" },
    });

    render(
      <ProfilePicture
        username={username}
        onClose={mockOnClose}
        currentProfilePic={currentProfilePic}
        onProfilePicUpdate={mockOnProfilePicUpdate}
      />
    );

    const fileInput = screen.getByTestId("upload-image");
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(mockOnProfilePicUpdate).toHaveBeenCalledWith(
        "http://example.com/new-pic.jpg"
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows an error message when submitting without selecting an image", async () => {
    render(
      <ProfilePicture
        username={username}
        onClose={mockOnClose}
        onProfilePicUpdate={mockOnProfilePicUpdate}
      />
    );

    fireEvent.submit(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(
        screen.getByText("Please select a file before submitting.")
      ).toBeInTheDocument();
    });
  });

//   it("handles server errors during form submission", async () => {
//     const file = new File(["example image"], "example.png", {
//       type: "image/png",
//     });
//     axios.put.mockRejectedValue(new Error("Network error"));

//     render(
//       <ProfilePicture
//         username={username}
//         onClose={mockOnClose}
//         currentProfilePic={currentProfilePic}
//         onProfilePicUpdate={mockOnProfilePicUpdate}
//       />
//     );

//     const fileInput = screen.getByTestId("upload-image");
//     fireEvent.change(fileInput, {
//       target: { files: [file] },
//     });

//     fireEvent.submit(screen.getByRole("button", { name: "Upload" }));

//     await waitFor(() => {
//       expect(
//         screen.getByText("Error uploading profile picture.")
//       ).toBeInTheDocument();
//     });
//   });

//   it("closes the modal when the close button is clicked", () => {
//     render(
//       <ProfilePicture
//         username={username}
//         onClose={mockOnClose}
//         currentProfilePic={currentProfilePic}
//         onProfilePicUpdate={mockOnProfilePicUpdate}
//       />
//     );
//     fireEvent.click(screen.getByText("Close"));
//     expect(mockOnClose).toHaveBeenCalledTimes(1);
//   });
});
