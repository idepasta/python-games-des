import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient(), session: null } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches a page for /studio", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient(), session: null } });
    const matches = router.matchRoutes("/studio");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches login, register, and recover screens", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient(), session: null } });
    expect(router.matchRoutes("/login").at(-1)?.routeId).toBe("/login");
    expect(router.matchRoutes("/register").at(-1)?.routeId).toBe("/register");
    expect(router.matchRoutes("/recover").at(-1)?.routeId).toBe("/recover");
  });
});
