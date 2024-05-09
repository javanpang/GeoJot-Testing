import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import WeatherWidget from "./WeatherWidget";
import "@testing-library/jest-dom";

describe("WeatherWidget Component", () => {
  let consoleError;
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    consoleError = console.error;
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = consoleError;
  });

  test("should display loading message initially", () => {
    render(<WeatherWidget />);
    expect(screen.getByText("Loading weather...")).toBeInTheDocument();
  });

  test("should display weather data when fetch is successful", async () => {
    const mockWeatherData = {
      main: { temp: 15 },
      weather: [{ main: "Clear", icon: "01d" }],
      name: "Liverpool",
    };
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockWeatherData),
    });

    render(<WeatherWidget />);
    await waitFor(() => screen.getByText(/Temperature:/i));
    expect(screen.getByText(/Temperature:/i)).toBeInTheDocument();
    expect(screen.getByText(/15°c/i)).toBeInTheDocument();
    expect(screen.getByText(/Weather:/i)).toBeInTheDocument();
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
    expect(screen.getByAltText("Weather icon")).toBeInTheDocument();
  });

  test("should handle fetch failure", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<WeatherWidget />);
    await waitFor(() =>
      expect(screen.getByText("Loading weather...")).toBeInTheDocument()
    );
  });

  test("should handle unsupported geolocation", () => {
    delete global.navigator.geolocation;

    render(<WeatherWidget />);
    expect(console.error).toHaveBeenCalledWith(
      "Geolocation is not supported by this browser. Defaulting to Liverpool, England."
    );
  });
});
