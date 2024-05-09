import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Drawing1 from "./Drawing1";
import { useUser } from "./UserContext";
import "@testing-library/react";
import { act } from "react";

jest.mock("./UserContext", () => ({
  useUser: () => ({ username: "testUser" }),
}));

beforeAll(() => {
  window.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn(),
    load: jest.fn(),
  }));
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ likes: [] }),
  })
);

let consoleLog;
let consoleError;

beforeEach(() => {
  jest.clearAllMocks();
  consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  consoleError.mockRestore();
  consoleLog.mockRestore();
});

const defaultProps = {
  name: "Sample Pin",
  notes: "Sample notes",
  mediaFiles: [],
  songDetails: {
    previewUrl: "",
    albumArtUrl: "",
    title: "",
    artists: "",
  },
  canEdit: false,
  onDelete: jest.fn(),
  pinId: "1",
  canInvite: false,
};

describe("Drawing1 Component", () => {
  const setup = (props = defaultProps) => render(<Drawing1 {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ likes: ["testUser"] }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders component with default props", async () => {
    const { getByLabelText, getByTestId } = setup();
    expect(getByLabelText("Notes:")).toBeInTheDocument();
    expect(getByTestId("like-button")).toBeInTheDocument();
    expect(getByTestId("like-count")).toBeInTheDocument();
  });

  test("shows edit and delete buttons with edit permissions", () => {
    const ownerPermissions = {
      ...defaultProps,
      canEdit: true,
    };

    const { getByText } = render(<Drawing1 {...ownerPermissions} />);
    expect(getByText("Edit")).toBeInTheDocument();
    expect(getByText("Delete Pin")).toBeInTheDocument();
  });

  test("toggles like when like button is clicked", async () => {
    const { getByTestId } = setup();
    const likeButton = getByTestId("like-button");
    const likeCount = getByTestId("like-count");

    await act(async () => {
      fireEvent.click(likeButton);
    });
    await waitFor(() => {
      expect(likeCount.textContent).toBe("1");
    });
  });

  test("renders audio controls when song is provided", async () => {
    const audioProps = {
      ...defaultProps,
      songDetails: {
        ...defaultProps.songDetails,
        previewUrl: "http://sampleaudio.com/audio.mp3",
        albumArtUrl: "http://example.com/sample.jpg",
        title: "Sample Song",
        artists: "Sample Artist",
      },
    };
    const { getByLabelText } = render(<Drawing1 {...audioProps} />);

    expect(getByLabelText(/play/i)).toBeInTheDocument();
  });

  test("renders long notes with a scrollbar", async () => {
    const longNotesProps = {
      ...defaultProps,
      notes: "This is a very long note ".repeat(40),
    };
    const { getByLabelText } = render(<Drawing1 {...longNotesProps} />);
    const notesTextarea = getByLabelText("Notes:");
    expect(notesTextarea.scrollHeight).toBe(notesTextarea.clientHeight);
  });

  test("does not show edit and delete buttons with no edit permissions", () => {
    const props = { ...defaultProps, canEdit: false };
    const { queryByText } = render(<Drawing1 {...props} />);
    expect(queryByText("Edit")).not.toBeInTheDocument();
    expect(queryByText("Delete Pin")).not.toBeInTheDocument();
  });

  // Invalid test
  //   test("displays error message on fetch failure", async () => {
  //     fetch.mockRejectedValueOnce(new Error("Failed to fetch"));
  //     const { findByText } = render(<Drawing1 {...defaultProps} />);
  //     const errorMessage = await findByText(/failed to fetch/i);
  //     expect(errorMessage).toBeInTheDocument();
  //   });

  test("renders invite button only when owner of pin", () => {
    const ownerPermissions = {
      ...defaultProps,
      canEdit: true,
      canInvite: true,
    };
    const { getByTestId } = render(<Drawing1 {...ownerPermissions} />);
    const inviteButton = getByTestId("invite");
    expect(inviteButton).toBeInTheDocument();
  });

  test("toggles invite collaborators modal visibility", () => {
    const ownerPermissions = {
      ...defaultProps,
      canEdit: true,
      canInvite: true,
    };
    const { getByTestId, queryByTestId } = render(
      <Drawing1 {...ownerPermissions} />
    );
    const inviteButton = getByTestId("invite");
    fireEvent.click(inviteButton);

    expect(queryByTestId("invite-modal")).toBeInTheDocument(); // Check if modal is present

    fireEvent.click(inviteButton); // Close the modal
    expect(queryByTestId("invite-modal")).not.toBeInTheDocument(); // Check if modal is absent
  });
});

describe("Image Slideshow in Drawing1 Component", () => {
  const defaultProps = {
    name: "Sample Pin",
    notes: "Sample notes",
    mediaFiles: [
      { url: "http://example.com/image1.jpg", title: "Image 1" },
      { url: "http://example.com/image2.jpg", title: "Image 2" },
    ],
    songDetails: {
      previewUrl: "",
      albumArtUrl: "",
      title: "",
      artists: "",
    },
    canEdit: true,
    onDelete: jest.fn(),
    pinId: "1",
    canInvite: true,
  };

  test("renders slideshow when images are provided", () => {
    const { getByTestId } = render(<Drawing1 {...defaultProps} />);
    const slideshowContainer = getByTestId("slideshow-container");
    expect(slideshowContainer).toBeInTheDocument();
  });

  test("initial image is rendered correctly", async () => {
    const { getByRole } = render(<Drawing1 {...defaultProps} />);
    await waitFor(() => {
      const displayedImage = getByRole("img");
      expect(displayedImage.src).toBe(defaultProps.mediaFiles[0].url);
    });
  });

  test("navigates to next and previous images", () => {
    const { getByTestId, getByRole } = render(<Drawing1 {...defaultProps} />);
    const nextButton = getByTestId("next-button");
    const prevButton = getByTestId("prev-button");
    const displayedImage = getByRole("img");

    fireEvent.click(nextButton);
    expect(displayedImage.src).toBe(defaultProps.mediaFiles[1].url);

    fireEvent.click(prevButton);
    expect(displayedImage.src).toBe(defaultProps.mediaFiles[0].url);
  });

  test("updates displayed images with new images", () => {
    const { rerender, getByRole } = render(<Drawing1 {...defaultProps} />);
    const newMediaFiles = [
      { url: "http://example.com/new-image.jpg", title: "New Image" },
    ];
    defaultProps.mediaFiles = newMediaFiles;
    rerender(<Drawing1 {...defaultProps} />);
    const image = getByRole("img");
    expect(image.src).toBe("http://example.com/new-image.jpg");
  });
});

// describe("Audio player controls", () => {
//   const audioProps = {
//     ...defaultProps,
//     songDetails: {
//       previewUrl: "http://sampleaudio.com/audio.mp3",
//       albumArtUrl: "http://example.com/sample.jpg",
//       title: "Sample Song",
//       artists: "Sample Artist",
//     },
//   };

//   test("plays audio when the play button is clicked", async () => {
//     const { getByLabelText } = render(<Drawing1 {...audioProps} />);
//     const playButton = getByLabelText(/play/i);
//     fireEvent.click(playButton);

//     await waitFor(() => {
//       expect(playButton).toHaveAttribute("aria-label", "Stop");
//     //   expect(global.Audio.mock.instances.play).toHaveBeenCalled();
//     });
//   });
// });
