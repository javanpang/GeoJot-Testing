import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import Map from "./Map";
import { useUser } from "./UserContext";
import { usePins } from "./PinContext";
import "@testing-library/jest-dom";
import { useMap } from "react-leaflet";

jest.mock("./UserContext", () => ({
  useUser: jest.fn(() => ({ username: "testuser" })),
}));

jest.mock("./PinContext", () => ({
  usePins: jest.fn().mockReturnValue({ fetchRecentPins: jest.fn() }),
}));

jest.mock("react-leaflet", () => ({
  useMap: jest.fn().mockReturnValue({
    flyTo: jest.fn(),
  }),
  useMapEvents: jest.fn(),
  MapContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  TileLayer: () => <div></div>,
  Marker: ({ children, eventHandlers, ...props }) => {
    if (eventHandlers && eventHandlers.click) {
      props.onClick = eventHandlers.click;
    }
    props["data-testid"] = `marker-${props._id || "default"}`;
    return <div {...props}>{children}</div>;
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({ _id: "new-pin", position: { lat: 10, lng: 10 } }),
  })
);

describe("Map Component", () => {
  let consoleErrorMock;

  beforeEach(() => {
    consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            _id: "123",
            position: { lat: 10, lng: 10 },
            username: "testuser",
            details: "Details about the pin",
          },
        ]),
    });

    jest.mock("./UserContext", () => ({
      useUser: jest.fn(() => ({ username: "testuser" })),
    }));

    jest.mock("./PinContext", () => ({
      usePins: jest.fn(() => ({ fetchRecentPins: jest.fn() })),
    }));

    global.navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 53.41173,
            longitude: -2.982645,
          },
        })
      ),
    };
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
    jest.clearAllMocks();
  });

  test("renders the map component", () => {
    const { getByTestId } = render(<Map />);
    expect(getByTestId("map-container")).toBeInTheDocument();
  });

  test("pins render on map", async () => {
    const fakePins = [
      { _id: "123", position: { lat: 10, lng: 10 }, details: {} },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakePins),
    });

    const { findByTestId } = render(<Map />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      "https://geojotbackend.onrender.com/api/pins?username=testuser"
    );

    const mapContainer = await findByTestId("map-container");
    expect(mapContainer).toBeInTheDocument();
  });

  test("displays an error message if fetching pins fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { findByText } = render(<Map />);
    const errorMessage = await findByText(/failed to load pins/i);

    expect(errorMessage).toBeInTheDocument();
  });

  test("allows a user to place a pin on the map", async () => {
    useUser.mockReturnValue({ username: "testuser" });
    usePins.mockReturnValue({ fetchRecentPins: jest.fn() });

    const { getByTestId, findByTestId, rerender } = render(<Map />);
    const mapContainer = getByTestId("map-container");

    await waitFor(() => {
      expect(mapContainer).toBeInTheDocument();
    });

    fireEvent.contextMenu(mapContainer, {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });

    const newMarker = await findByTestId("marker-123");
    expect(newMarker).toBeInTheDocument();
  });

  test("shows the form modal when a pin is clicked by owner", async () => {
    const { findByTestId } = render(<Map />);
    const marker = await findByTestId("marker-123");
    fireEvent.click(marker);

    const formModal = await findByTestId("form-modal");
    expect(formModal).toBeInTheDocument();
  });

  test("deletes a marker when delete button is clicked", async () => {
    const { findByTestId, getByText } = render(<Map />);

    const marker = await findByTestId("marker-123");
    fireEvent.click(marker);

    fetch.mockResolvedValueOnce({ ok: true });

    const deleteButton = getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  test("shows the details modal when clicking on a pin", async () => {
    useUser.mockReturnValue({ username: "nonOwnerUser" });
    usePins.mockReturnValue({
      fetchRecentPins: jest.fn(),
      pins: [
        {
          _id: "123",
          position: { lat: 10, lng: 10 },
          username: "ownerUser",
          details: "Details about the pin",
        },
      ],
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(usePins),
    });

    const { findByTestId } = render(<Map />);
    const marker = await findByTestId("marker-123");
    fireEvent.click(marker);

    const detailsModal = await findByTestId("details-modal");
    expect(detailsModal).toBeInTheDocument();
  });

  test("prevents adding pins if the user is viewing another user's map", async () => {
    useUser.mockReturnValue({ username: "otherUser" });
    const { queryByTestId } = render(<Map />);
    fireEvent.contextMenu(queryByTestId("map-container"), {
      clientX: 100,
      clientY: 100,
    });

    const formModal = queryByTestId("form-modal");
    expect(formModal).not.toBeInTheDocument();
  });

  test("flies to the new location when selectedLocation changes", () => {
    const flyToMock = jest.fn();
    const setSelectedLocationMock = jest.fn();
    useMap.mockImplementation(() => ({ flyTo: flyToMock }));

    const { rerender } = render(
      <Map
        selectedLocation={null}
        setSelectedLocation={setSelectedLocationMock}
      />
    );

    const newLocation = { lat: 20, lng: 20 };
    rerender(
      <Map
        selectedLocation={newLocation}
        setSelectedLocation={setSelectedLocationMock}
      />
    );

    expect(flyToMock).toHaveBeenCalledWith(
      [20, 20],
      expect.any(Number)
    );
    expect(setSelectedLocationMock).toHaveBeenCalledWith(null);
  });

  it("flies to the selected pin", () => {
    const flyToMock = jest.fn();
    const setSelectedPinMock = jest.fn();

    useMap.mockImplementation(() => ({ flyTo: flyToMock }));

    const selectedPin = {
      _id: "pin1",
      position: { lat: 20, lng: 20 },
    };
    const { rerender } = render(
      <Map selectedPin={selectedPin} setSelectedPin={setSelectedPinMock} />
    );

    rerender(
      <Map selectedPin={selectedPin} setSelectedPin={setSelectedPinMock} />
    );

    expect(flyToMock).toHaveBeenCalledWith(
      [20, 20],
      expect.any(Number)
    );
    expect(setSelectedPinMock).toHaveBeenCalledWith(null);
  });
});
