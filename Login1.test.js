import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  BrowserRouter: ({ children }) => <div>{children}</div>,
}));

jest.mock("./usercontext", () => ({
  useUser: () => ({
    setUsername: jest.fn(),
  }),
}));

describe("Login Component", () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  });

  test("initially displays the login form", () => {
    expect(screen.getByText("Welcome to GeoJot")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.getByText("Don't have an account? Sign up")
    ).toBeInTheDocument();
  });

  test("allows entry of username and password", async () => {
    await userEvent.type(screen.getByPlaceholderText("Username"), "john_doe");
    await userEvent.type(screen.getByPlaceholderText("Password"), "s3cr3t");

    expect(screen.getByPlaceholderText("Username")).toHaveValue("john_doe");
    expect(screen.getByPlaceholderText("Password")).toHaveValue("s3cr3t");
  });

  test("submits form and shows expected message on success", async () => {
    axios.post.mockResolvedValue({ data: { user: { username: "john_doe" } } });

    await userEvent.type(screen.getByPlaceholderText("Username"), "john_doe");
    await userEvent.type(screen.getByPlaceholderText("Password"), "s3cr3t");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.queryByText("Welcome to GeoJot")).not.toBeInTheDocument()
    );
  });

  test("handles failed login due to incorrect credentials", async () => {
    axios.post.mockRejectedValue(new Error("Invalid username or password"));

    await userEvent.type(screen.getByPlaceholderText("Username"), "john_doe");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "wrongpassword"
    );
    userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument()
    );
  });

  test("displays error message on login failure due to network", async () => {
    axios.post.mockRejectedValue(new Error("Network error"));

    await userEvent.type(screen.getByPlaceholderText("Username"), "john_doe");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "wrong_password"
    );
    fireEvent.click(screen.getByText("Login"));

    const errorMessage = await screen.findByText(
      "An unexpected error occurred. Please try again."
    );
    await waitFor(() => expect(errorMessage).toBeInTheDocument());
  });
});
