import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount rendered trees between tests; without globals enabled Testing
// Library cannot register this itself.
afterEach(() => {
  cleanup();
});
