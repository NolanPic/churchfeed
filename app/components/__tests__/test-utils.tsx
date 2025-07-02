import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
require("dotenv").config({ path: ".env.local" });

const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexTestProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

export function renderWithConvex(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ConvexTestProvider,
    ...options,
  });
}

export * from "@testing-library/react";
export { renderWithConvex as render };
