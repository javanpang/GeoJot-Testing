import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import "@testing-library/jest-dom";
import Register from "./Register";
import { MemoryRouter } from "react-router-dom";

describe("Register Component", () => {
  let mock;
  let consoleError;
  let consoleLog;

  beforeEach(() => {
    delete window.location;
    window.location = { reload: jest.fn() };
    mock = new MockAdapter(axios);
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
  });

  afterEach(() => {
    window.location.reload.mockRestore();
    consoleError.mockRestore();
    consoleLog.mockRestore();
    mock.reset();
  });

  test("renders registration form with required fields", () => {
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register" })
    ).toBeInTheDocument();
  });

  test("submits form and handles successful registration", async () => {
    mock.onPost("https://geojotbackend.onrender.com/api/register").reply(200, {
      message: "User registered successfully",
    });

    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "newuser@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        "User registered successfully:",
        { message: "User registered successfully" }
      );
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  test("displays an error message on registration failure due to invalid username", async () => {
    mock.onPost("https://geojotbackend.onrender.com/api/register").reply(400, {
      error: "Username must be between 4 and 20 characters",
    });

    await userEvent.type(screen.getByPlaceholderText("Username"), "nu");
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "newuser@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Username must be between 4 and 20 characters"
      );
    });
  });

  test("displays an error message on registration failure due to existing email", async () => {
    mock
      .onPost("https://geojotbackend.onrender.com/api/register", {
        email: "newuser@example.com",
        username: "John",
        password: "password123",
      })
      .reply(400, {
        error: "Email already exists.",
      });

    await userEvent.type(screen.getByPlaceholderText("Username"), "John");
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "newuser@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists.")).toBeInTheDocument();
    });
  });

  test("displays an error message on registration failure due to invalid password", async () => {
    mock.onPost("https://geojotbackend.onrender.com/api/register", {
      username: "ValidUser",
      email: "valid@example.com",
      password: "weak",
    }).reply(400, {
      error: "Password does not meet criteria.",
      failedRules: ['minLength', 'digit', 'uppercase']
    });
  
    await userEvent.type(screen.getByPlaceholderText("Username"), "ValidUser");
    await userEvent.type(screen.getByPlaceholderText("Email"), "valid@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "weak");
    userEvent.click(screen.getByRole("button", { name: "Register" }));
  
    await waitFor(() => {
      expect(screen.getByText("Password does not meet criteria.")).toBeInTheDocument();
    });
  });

  test("displays an error message on registration failure due to existing username", async () => {
    mock.onPost("https://geojotbackend.onrender.com/api/register", {
      username: "ExistingUser",
      email: "user@example.com",
      password: "ValidPassword123",
    }).reply(400, {
      error: "Username already exists."
    });
  
    await userEvent.type(screen.getByPlaceholderText("Username"), "ExistingUser");
    await userEvent.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "ValidPassword123");
    userEvent.click(screen.getByRole("button", { name: "Register" }));
  
    await waitFor(() => {
      expect(screen.getByText("Username already exists.")).toBeInTheDocument();
    });
  });
  
  
});
