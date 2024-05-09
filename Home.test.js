import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import Home from "./Home";
import { UserContext } from "./UserContext";
import { PinContext } from "./PinContext";
import "@testing-library/jest-dom";
import { act } from "@testing-library/react";

jest.mock("./UserProfile");
jest.mock("./Map");
jest.mock("./WeatherWidget");
jest.mock("./Search");

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        address: {
          road: "Lime Street",
          city: "Liverpool",
        },
      }),
  })
);

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const userValue = {
  username: "testuser",
  logout: mockLogout,
};

const pinValue = {
  recentPins: [
    { _id: "pin1", name: "Pin One", position: { lat: 34.05, lng: -118.25 } },
  ],
  fetchRecentPins: jest.fn(),
};

describe("Home component", () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ followers: [] }),
    });
  });

  test("renders home without crashing", () => {
    render(
      <UserContext.Provider value={userValue}>
        <PinContext.Provider value={pinValue}>
          <Home />
        </PinContext.Provider>
      </UserContext.Provider>
    );
    expect(screen.getByText("Recent Pins")).toBeInTheDocument();
    expect(screen.getByText("Meteorology")).toBeInTheDocument();
  });

  test("displays user information correctly", () => {
    render(
      <UserContext.Provider value={{ ...userValue, username: "testuser123" }}>
        <PinContext.Provider value={pinValue}>
          <Home />
        </PinContext.Provider>
      </UserContext.Provider>
    );
    expect(screen.getByText("@testuser123")).toBeInTheDocument();
  });

  test("shows default state of settings modal as hidden", () => {
    render(
      <UserContext.Provider value={userValue}>
        <PinContext.Provider value={pinValue}>
          <Home />
        </PinContext.Provider>
      </UserContext.Provider>
    );
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  test("calls logout and navigates on logout click", async () => {
    render(
      <UserContext.Provider value={userValue}>
        <PinContext.Provider value={pinValue}>
          <Home />
        </PinContext.Provider>
      </UserContext.Provider>
    );

    fireEvent.mouseEnter(screen.getByAltText("User Profile Picture"));
    await screen.findByText("Logout");
    fireEvent.click(screen.getByText("Logout"));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders fetched pins after initial fetch", async () => {
    render(
      <UserContext.Provider value={userValue}>
        <PinContext.Provider value={pinValue}>
          <Home />
        </PinContext.Provider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("Pin One")).toBeInTheDocument();
    });
  });
});
