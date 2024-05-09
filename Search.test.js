import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";

describe("Search Component", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const mockOnSelectUser = jest.fn();
  const mockOnSelectLocation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      })
    );
  });

  test("renders the search input", () => {
    render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );
    expect(
      screen.getByPlaceholderText("Search users or places...")
    ).toBeInTheDocument();
  });

  test("handles input change and triggers search", async () => {
    render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Search users or places..."), {
      target: { value: "test" },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  test("displays loading during fetch and handles error state", async () => {
    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error("Failed to fetch")), 50)
        )
    );
    render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Search users or places..."), {
      target: { value: "error" },
    });
    await waitFor(() =>
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByText("Error: Failed to fetch")).toBeInTheDocument()
    );
  });

  test("switches tabs and displays appropriate content", async () => {
    render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );
    fireEvent.focus(screen.getByPlaceholderText("Search users or places..."));
    fireEvent.click(screen.getByText("Places"));
    expect(screen.getByText("Places").style.fontWeight).toBe("bold");
  });

  test("closes search results when clicking outside", () => {
    const { container } = render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );
    fireEvent.mouseDown(document);
    expect(screen.queryByText("Search results")).not.toBeInTheDocument();
  });

  test("calls onSelectUser when a user result is clicked", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve([{ _id: "1", username: "testuser" }]),
      })
    );
    render(
      <Search
        onSelectUser={mockOnSelectUser}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    fireEvent.focus(screen.getByPlaceholderText("Search users or places..."));
    fireEvent.change(screen.getByPlaceholderText("Search users or places..."), {
      target: { value: "test" },
    });
    await waitFor(() => screen.getByText("testuser"));
    fireEvent.click(screen.getByText("testuser"));

    expect(mockOnSelectUser).toHaveBeenCalledWith({
      _id: "1",
      username: "testuser",
    });
  });

  //   test("searches for places and displays results", async () => {
  //     const mockOnSelectUser = jest.fn();
  //     const mockOnSelectLocation = jest.fn();

  //     global.fetch.mockImplementation((url) => {
  //       if (url.includes("places")) {
  //         return Promise.resolve({
  //           json: () =>
  //             Promise.resolve([
  //               { place_id: "1", description: "Place 1" },
  //               { place_id: "2", description: "Place 2" },
  //             ]),
  //         });
  //       }
  //       return Promise.resolve({ json: () => Promise.resolve([]) });
  //     });

  //     render(<Search onSelectUser={mockOnSelectUser} onSelectLocation={mockOnSelectLocation} />);

  //     const input = screen.getByPlaceholderText("Search users or places...");
  //     fireEvent.focus(input);
  //     fireEvent.change(input, {
  //       target: { value: "Place" },
  //     });

  //     const placesTab = await screen.findByText("Places", {}, { timeout: 3000 });
  //     fireEvent.click(placesTab);

  //     const place1 = await screen.findByText(/place 1/i);
  //     const place2 = await screen.findByText(/place 2/i);

  //     expect(place1).toBeInTheDocument();
  //     expect(place2).toBeInTheDocument();

  //     fireEvent.click(place1);
  //     expect(mockOnSelectLocation).toHaveBeenCalledWith({
  //       place_id: "1",
  //       description: "Place 1",
  //     });
  //   });
});
