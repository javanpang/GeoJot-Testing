import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  getByTestId,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import Form from "./Form";
import "@testing-library/react";
import Dropzone from "react-dropzone";
import userEvent from "@testing-library/user-event";

jest.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: jest.fn(() => ({
      "data-testid": "dropzone",
    })),
    getInputProps: () => ({ type: "file", "data-testid": "file-input" }),
  }),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
}));

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => "image.png");
  global.URL.revokeObjectURL = jest.fn();
});

afterAll(() => {
  global.URL.createObjectURL.mockRestore();
});

afterEach(() => {
  global.URL.revokeObjectURL = jest.fn();
});

describe("Form Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSubmissionSuccess = jest.fn();
  const initialProps = {
    onSubmit: mockOnSubmit,
    onDelete: mockOnDelete,
    onSubmissionSuccess: mockOnSubmissionSuccess,
    _id: "123",
    initialMediaFiles: [],
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders all form fields and submit button", () => {
    render(<Form {...initialProps} />);
    expect(screen.getByLabelText(/Name:/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name...")).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes:/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter notes...")).toBeInTheDocument();
    expect(screen.getByText(/Attach Media:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Music:/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
  });

  test("handles input changes for name and notes fields", async () => {
    render(<Form {...initialProps} />);
    const nameInput = screen.getByLabelText(/Name:/i);
    const notesTextarea = screen.getByLabelText(/Notes:/i);

    fireEvent.change(nameInput, { target: { value: "Test Name" } });
    fireEvent.change(notesTextarea, { target: { value: "Some test notes" } });

    await waitFor(() => {
      expect(nameInput.value).toBe("Test Name");
      expect(notesTextarea.value).toBe("Some test notes");
    });
  });

  test("validates name input for proper length", async () => {
    render(<Form />);
    const nameInput = screen.getByLabelText(/Name:/i);
    fireEvent.change(nameInput, { target: { value: "Yo" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Name must be between 3 and 21 characters/i)
      ).toBeInTheDocument();
    });
  });

  test("submits form data correctly", async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    render(<Form onSubmit={jest.fn()} onSubmissionSuccess={jest.fn()} />);
    const nameInput = screen.getByLabelText(/Name:/i);
    const notesTextarea = screen.getByLabelText(/Notes:/i);

    fireEvent.change(nameInput, { target: { value: "Valid Name" } });
    fireEvent.change(notesTextarea, { target: { value: "Some valid notes" } });
    fireEvent.submit(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test("fetches and displays music search results", async () => {
    const musicSearchResults = {
      tracks: {
        items: [
          {
            id: "track1",
            name: "Song One",
            artists: [{ name: "Artist1" }],
            album: { images: [{ url: "http://example.com/cover.jpg" }] },
            preview_url: "http://example.com/preview.mp3",
          },
        ],
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(musicSearchResults),
    });

    render(<Form />);
    const musicInput = screen.getByLabelText(/Music:/i);
    fireEvent.change(musicInput, { target: { value: "Song" } });

    await waitFor(() => {
      expect(screen.getByText("Song One")).toBeInTheDocument();
    });
  });

  test("handles audio play from search", async () => {
    const musicSearchResults = {
      tracks: {
        items: [
          {
            id: "track1",
            name: "Song One",
            artists: [{ name: "Artist1" }],
            album: { images: [{ url: "http://example.com/cover.jpg" }] },
            preview_url: "http://example.com/preview.mp3",
          },
        ],
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(musicSearchResults),
      })
    );

    render(<Form {...initialProps} />);
    const musicInput = screen.getByPlaceholderText("Search music...");
    fireEvent.change(musicInput, { target: { value: "Song" } });

    const playButton = await screen.findByRole("button", { name: /Play/ });
    await expect(playButton.toBeInTheDocument);
  });
  test("handles submission error correctly", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });
    render(<Form {...initialProps} />);
    fireEvent.submit(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit form:/)).toBeInTheDocument();
    });
  });
});

describe("Form Component - Image Upload Tests", () => {
  const initialProps = {
    onSubmit: jest.fn(),
    onDelete: jest.fn(),
    onSubmissionSuccess: jest.fn(),
    _id: "123",
    initialMediaFiles: [],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  function dispatchEvt(node, type, data) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, data);
    fireEvent(node, event);
  }

  function mockData(files) {
    return {
      dataTransfer: {
        files: files,
        items: files.map((file) => ({
          kind: "file",
          type: file.type,
          getAsFile: () => file,
        })),
        types: ["Files"],
      },
    };
  }

  test("renders dropzone component", () => {
    const { getByTestId } = render(<Form />);
    expect(getByTestId("media-dropzone")).toBeInTheDocument();
    expect(getByTestId("file-input")).toBeInTheDocument();
  });

  test("allows user to upload image", async () => {
    const { getByTestId } = render(<Form />);

    const mockFile = new File(["image-content"], "test-image.png", {
      type: "image/png",
    });

    const fileInput = getByTestId("file-input");
    Object.defineProperty(fileInput, "files", {
      value: [mockFile],
    });
    fireEvent.change(fileInput);

    const previews = await screen.findAllByRole("img");
    expect(previews.length).toBeGreaterThan(0);
  });

  test("rejects non-image files with alert message", async () => {
    const { getByTestId } = render(<Form />);

    const mockFile = new File(["image-content"], "test-file.txt", {
      type: "text/plain",
    });

    const fileInput = getByTestId("file-input");
    Object.defineProperty(fileInput, "files", {
      value: [mockFile],
    });
    fireEvent.change(fileInput);

    const previews = await screen.findAllByRole("img");
    expect(previews.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(
        screen.getByText("Only image files are allowed")
      ).toBeInTheDocument();
    });
  });

  test("allows user to remove an uploaded image", async () => {
    const initialMediaFiles = [
      {
        preview: "image1.png",
        file: new File([""], "image1.png", { type: "image/png" }),
      },
    ];
    const { getByText, queryByText } = render(
      <Form initialMediaFiles={initialMediaFiles} />
    );
    expect(
      screen.getByRole("img", { name: "Media preview 0" })
    ).toBeInTheDocument();

    const removeButton = getByText("Remove");

    fireEvent.click(removeButton);

    expect(queryByText("Media preview 0")).not.toBeInTheDocument();
  });

  test("does not allow to add more than 9 images", async () => {
    const initialMediaFiles = [];
    for (let i = 0; i < 9; i++) {
      initialMediaFiles.push({
        preview: `url-to-image${i}.png`,
        file: new File(["(⌐□_□)"], `image${i}.png`, { type: "image/png" }),
      });
    }

    const { getByTestId } = render(
      <Form initialMediaFiles={initialMediaFiles} />
    );

    expect(screen.getAllByRole("img").length).toBe(9);

    const file = new File(["(⌐□_□)"], "image10.png", { type: "image/png" });
    const input = getByTestId("file-input");
    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.drop(getByTestId("media-dropzone"), {
      dataTransfer: { files: [file] },
    });

    await screen.findByText("Maximum images reached");

    expect(screen.getAllByRole("img").length).toBe(9);
    expect(screen.queryByText("Maximum images reached")).toBeInTheDocument();
  });
});
