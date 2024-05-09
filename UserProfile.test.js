import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserProfile from "./UserProfile";
import { useUser } from "./UserContext";
import "@testing-library/jest-dom";

jest.mock("./UserContext", () => ({
  useUser: jest.fn(),
}));

global.fetch = jest.fn();

const mockCloseUserProfile = jest.fn();
const userData = {
  username: "testuser",
  followers: ["testuser2"],
};

describe("UserProfile Component", () => {
  beforeEach(() => {
    useUser.mockReturnValue({ username: "testuser2" });
    fetch.mockClear();
    mockCloseUserProfile.mockClear();
    fetch.mockImplementation((url) => {
      if (url.includes("search?query=")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              { username: "testuser", profilePic: "new-pic.jpg" },
            ]),
        });
      } else if (url.includes("/api/users/")) {
        return Promise.resolve({
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });
  });

  test("renders with default profile picture for new account", async () => {
    fetch.mockResolvedValueOnce({
      json: jest
        .fn()
        .mockResolvedValue([{ username: "testuser", profilePic: null }]),
    });

    render(
      <UserProfile
        userData={userData}
        closeUserProfile={mockCloseUserProfile}
      />
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByAltText("Profile").src).toContain(
      "default-profile-pic.jpg"
    );
  });

  it("updates profile picture when data is fetched successfully", async () => {
    fetch.mockResolvedValueOnce({
      json: jest
        .fn()
        .mockResolvedValue([{ username: "testuser", profilePic: null }]),
    });

    render(
      <UserProfile
        userData={userData}
        closeUserProfile={mockCloseUserProfile}
      />
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByAltText("Profile").src).toContain(
      "default-profile-pic.jpg"
    );
  });

  it("follows and update followers count", async () => {
    fetch.mockImplementation((url) => {
      if (url.includes("unfollow")) {
        return Promise.resolve({ json: jest.fn().mockResolvedValue({}) });
      } else if (url.includes("follow")) {
        return Promise.resolve({ json: jest.fn().mockResolvedValue({}) });
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });

    render(
      <UserProfile
        userData={userData}
        closeUserProfile={mockCloseUserProfile}
      />
    );

    const followButton = screen.getByRole("button", { name: /follow/i });
    fireEvent.click(followButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("follow"),
        expect.any(Object)
      );
      expect(screen.queryByText("1 followers")).toBeInTheDocument();
    });
  });

  it("unfollows and updates follower count", async () => {
    useUser.mockReturnValue({ username: "testuser2" });
    fetch.mockImplementation((url) => {
      if (url.includes("unfollow")) {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({}),
        });
      } else if (url.includes("follow")) {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({}),
        });
      } else if (url.includes("search?query=")) {
        return Promise.resolve({
          json: jest
            .fn()
            .mockResolvedValue([
              { username: "testuser", profilePic: "new-pic.jpg" },
            ]),
        });
      }
      return Promise.reject(new Error("URL not matched in mock"));
    });

    render(
      <UserProfile
        userData={{ ...userData, followers: ["testuser2"] }}
        closeUserProfile={mockCloseUserProfile}
      />
    );

    expect(
      screen.getByRole("button", { name: /unfollow/i })
    ).toBeInTheDocument();
    expect(screen.getByText("1 followers")).toBeInTheDocument();

    const unfollowButton = screen.getByRole("button", { name: /unfollow/i });
    fireEvent.click(unfollowButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("unfollow"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ follower: "testuser2" }),
        })
      );
    });

    expect(screen.getByText("0 followers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
  });

  it("closes the profile view on close button click", () => {
    render(
      <UserProfile
        userData={userData}
        closeUserProfile={mockCloseUserProfile}
      />
    );

    fireEvent.click(screen.getByText("X"));
    expect(mockCloseUserProfile).toHaveBeenCalledTimes(1);
  });
});
