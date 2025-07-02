import { describe, test, expect } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { render } from "./test-utils";
import Feed from "../Feed";
import { Id } from "@/convex/_generated/dataModel";
describe("public feeds", () => {
  const orgId = "j975ta66paymghm3aaefx9bbms7jnhha" as Id<"organizations">;
  const { container } = render(<Feed orgId={orgId} />);

  test("should load and display posts from the database", async () => {
    await waitFor(() => {
      const postContent = container.querySelector(
        '[data-testid="feed-posts"] p'
      );
      expect(postContent).toBeTruthy();
    });
  });

  test("should load feeds in the feed selector from the database", async () => {
    const feedSelectorBtn = container.querySelector(
      '[data-testid="feed-selector"] button'
    );
    fireEvent.click(feedSelectorBtn!);

    await waitFor(() => {
      const feedSelectorItems = container.querySelectorAll(
        '[data-testid="feed-selector"] li'
      );
      // 1 and not 0 because the "All feeds" option is always present
      expect(feedSelectorItems.length).toBeGreaterThan(1);
    });
  });
});
