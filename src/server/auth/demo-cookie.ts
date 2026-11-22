import "server-only";

/**
 * Demo-mode session cookie (value "1"). Lives apart from memory.ts so the
 * proxy can read it without pulling in `next/headers`.
 */
export const DEMO_SESSION_COOKIE = "echo_demo_session";

export const DEMO_SESSION_VALUE = "1";
