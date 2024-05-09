import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { usePins, PinProvider } from "./PinContext";
import { useUser } from "./UserContext";
import { renderHook } from "@testing-library/react-hooks";

jest.mock("./UserContext", () => ({
  useUser: jest.fn(),
}));

global.fetch = jest.fn();

describe("PinContext", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with empty recent pins", () => {
    useUser.mockImplementation(() => ({ username: "testuser" }));
    const { result } = renderHook(() => usePins(), { wrapper: PinProvider });
    expect(result.current.recentPins).toEqual([]);
  });

  it("fetches recent pins successfully", async () => {
    useUser.mockImplementation(() => ({ username: "testuser" }));
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, title: "Test Pin" }]),
    });

    const { result, waitForNextUpdate } = renderHook(() => usePins(), {
      wrapper: PinProvider,
    });

    act(() => {
      result.current.fetchRecentPins();
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      "https://geojotbackend.onrender.com/api/pins/recent?username=testuser"
    );
    expect(result.current.recentPins).toEqual([{ id: 1, title: "Test Pin" }]);
  });

  it("handles fetch error", async () => {
    useUser.mockImplementation(() => ({ username: "testuser" }));
    fetch.mockResolvedValue({
      ok: false,
    });
    console.error = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() => usePins(), {
      wrapper: PinProvider,
    });

    act(() => {
      result.current.fetchRecentPins();
    });

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching recent pins:",
        new Error("Failed to fetch recent pins")
      )
    );
  });
});
