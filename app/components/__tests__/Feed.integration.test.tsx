import { describe, test, expect } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "./test-utils";
import { FeedWithOrg } from "./test-utils";

describe("public feeds", () => {
  const { container } = render(<FeedWithOrg />);

  test("should load and not error", async () => {
    await waitFor(() => {
      const loading = container.querySelector('[data-testid="loading"]');
      const error = container.querySelector('[data-testid="error"]');
      expect(loading).toBeFalsy();
      expect(error).toBeFalsy();
    });
  });

  test("should load feeds in the feed selector from the database", async () => {
    await waitFor(() => {
      const feedSelectorBtn = container.querySelector(
        '[data-testid="feed-selector"] button'
      );
      fireEvent.click(feedSelectorBtn!);
    });

    await waitFor(() => {
      const feedSelectorItems = container.querySelectorAll(
        '[data-testid="feed-selector"] li'
      );
      // 1 and not 0 because the "All feeds" option is always present
      expect(feedSelectorItems.length).toBeGreaterThan(1);
    });
  });

  test("should load posts from the selected feed", async () => {
    await waitFor(() => {
      const postContent = container.querySelector(
        '[data-testid="feed-posts"] p'
      );
      expect(postContent?.textContent).toContain(
        "High school graduation celebration for our seniors is June 15th. Save the date!"
      );
    });

    // Select a different feed
    const feedSelectorBtn = container.querySelector(
      '[data-testid="feed-selector"] button'
    );
    fireEvent.click(feedSelectorBtn!);

    const feedItem = screen.getByLabelText("Community Life");
    fireEvent.click(feedItem);

    await waitFor(() => {
      const postContent = container.querySelector(
        '[data-testid="feed-posts"] p'
      );
      expect(postContent?.textContent).toContain(
        "Photography walk through Pike Place Market was amazing. Sarah got some incredible shots of the fish throwing!"
      );
    });
  });
});
