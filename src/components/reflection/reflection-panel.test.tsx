import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Reflection } from "@/contracts/journal";

import { ReflectionPanel } from "./reflection-panel";
import { GENERATING_RETRY } from "./request-reflection";

const RECALLED = [
  {
    entryId: "demo-e04",
    date: "2026-11-15T09:00:00.000Z",
    quote: "I said things I didn’t mean.",
  },
  {
    entryId: "demo-e02",
    date: "2026-11-19T09:00:00.000Z",
    quote: "found the letters from my grandmother",
  },
];

const done = (overrides: Partial<Reflection> = {}): Reflection => ({
  entryId: "e1",
  status: "done",
  text: "A quiet flat after a loud month is worth noticing.",
  recalled: RECALLED,
  createdAt: "2026-11-22T10:00:00.000Z",
  ...overrides,
});

function headers(status: string, recalled: unknown = []) {
  return {
    "content-type": "text/plain; charset=utf-8",
    "x-echo-status": status,
    "x-echo-recalled": encodeURIComponent(JSON.stringify(recalled)),
  };
}

/** A streaming response whose chunks the test pushes one by one. */
function controlledStream(recalled: unknown = RECALLED) {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    response: new Response(body, { headers: headers("streaming", recalled) }),
    push: (text: string) => controller?.enqueue(encoder.encode(text)),
    close: () => controller?.close(),
  };
}

const fetchMock = vi.fn<typeof fetch>();

/** Visible copy, not the screen-reader status line that repeats it. */
const VISIBLE = "p:not([role='status'])";

function lastBody() {
  const init = fetchMock.mock.calls.at(-1)?.[1];
  return JSON.parse(String(init?.body)) as unknown;
}

beforeEach(() => {
  GENERATING_RETRY.delayMs = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReflectionPanel", () => {
  it("shows an existing reply with recalled notes, without asking again", () => {
    render(<ReflectionPanel entryId="e1" initialReflection={done()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Echo" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/A quiet flat after a loud month/)).toBeVisible();
    const aside = screen.getByRole("complementary", {
      name: "Recalled entries",
    });
    expect(within(aside).getByText("Recalled from Nov 15")).toBeVisible();
    expect(
      within(aside).getByText("“I said things I didn’t mean.”"),
    ).toBeVisible();
    expect(
      within(aside).getByRole("link", { name: "Open entry from Nov 19" }),
    ).toHaveAttribute("href", "/journal/demo-e02");
    expect(screen.getByText("Echo is not a therapist.")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Regenerate reply" }),
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains the empty margin before Echo has history", () => {
    render(
      <ReflectionPanel
        entryId="e1"
        initialReflection={done({ recalled: [] })}
      />,
    );
    expect(
      screen.getByText("Echo starts recalling after a few entries."),
    ).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("streams a reply for a just-saved entry, then shows the notes", async () => {
    const stream = controlledStream();
    fetchMock.mockResolvedValueOnce(stream.response);

    render(<ReflectionPanel entryId="e1" initialReflection={null} justSaved />);

    expect(lastBody()).toEqual({ entryId: "e1", regenerate: false });
    expect(screen.getByRole("status")).toHaveTextContent("Echo is replying…");

    await act(async () => {
      stream.push("Thank you for ");
    });
    await waitFor(() =>
      expect(screen.getByText(/^Thank you for/)).toBeVisible(),
    );
    expect(
      screen.getByText(/^Thank you for/).closest("[aria-busy]"),
    ).toHaveAttribute("aria-busy", "true");
    // Notes wait for the reply to finish.
    expect(
      screen.queryByRole("complementary", { name: "Recalled entries" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      stream.push("writing this.");
      stream.close();
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Reply ready"),
    );
    expect(screen.getByText("Thank you for writing this.")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Open entry from/ }),
    ).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("shows the crisis card instead of a reply", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { headers: headers("crisis") }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} justSaved />);

    const card = await screen.findByRole("alert");
    expect(card).toHaveTextContent("Echo isn’t a therapist");
    expect(within(card).getByRole("link", { name: "988" })).toHaveAttribute(
      "href",
      "tel:988",
    );
    expect(
      screen.queryByText("Echo is not a therapist."),
    ).not.toBeInTheDocument();
  });

  it("shows a saved crisis state without asking", () => {
    render(
      <ReflectionPanel
        entryId="e1"
        initialReflection={done({ status: "crisis", text: "", recalled: [] })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You don’t have to carry this alone",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the daily limit copy", async () => {
    const limit = "You've used today's 10 replies. Echo will be back tomorrow.";
    fetchMock.mockResolvedValueOnce(
      new Response(limit, { headers: headers("limit") }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} />);

    expect(await screen.findByText(limit, { selector: VISIBLE })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(limit);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("asks again when a limit was hit on an earlier day", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Hello again.", { headers: headers("streaming") }),
    );
    render(
      <ReflectionPanel
        entryId="e1"
        initialReflection={done({
          status: "limit",
          text: "You've used today's 10 replies. Echo will be back tomorrow.",
          recalled: [],
          createdAt: "2020-01-01T10:00:00.000Z",
        })}
      />,
    );
    expect(await screen.findByText("Hello again.")).toBeVisible();
  });

  it("keeps the entry safe on errors and lets the user try again", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "down" }, { status: 502 }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} justSaved />);

    expect(
      await screen.findByText(
        "Echo couldn't reply right now. Your entry is saved.",
        { selector: VISIBLE },
      ),
    ).toBeVisible();

    fetchMock.mockResolvedValueOnce(
      new Response("Here now.", { headers: headers("streaming", []) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Here now.")).toBeVisible();
    expect(lastBody()).toEqual({ entryId: "e1", regenerate: true });
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  it("treats a stream that breaks off as an error", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Half a "));
        controller.error(new Error("reset"));
      },
    });
    fetchMock.mockResolvedValueOnce(
      new Response(body, { headers: headers("streaming") }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} />);
    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeVisible();
  });

  it("offers to regenerate after an edit", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("A fresh reply.", { headers: headers("streaming", []) }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={done()} edited />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate reply" }));
    expect(await screen.findByText("A fresh reply.")).toBeVisible();
    expect(lastBody()).toEqual({ entryId: "e1", regenerate: true });
    expect(
      screen.queryByRole("button", { name: "Regenerate reply" }),
    ).not.toBeInTheDocument();
  });
  it("waits while the reply is generating elsewhere, then shows it", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(
        new Response("Saved in the other tab.", { headers: headers("done") }),
      );
    render(<ReflectionPanel entryId="e1" initialReflection={null} />);

    expect(screen.getByRole("status")).toHaveTextContent("Echo is replying…");
    expect(await screen.findByText("Saved in the other tab.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(lastBody()).toEqual({ entryId: "e1", regenerate: false });
  });

  it("gives up after a few waits and offers to try again", async () => {
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 409 }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} />);

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(GENERATING_RETRY.attempts + 1);
  });

  it("says Echo is busy when the model is rate-limited", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "busy" }, { status: 503 }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={null} justSaved />);

    expect(
      await screen.findByText(
        "Echo is busy right now. Your entry is saved — try again in a minute.",
        { selector: VISIBLE },
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("keeps the reply when a regenerate hits the daily limit", async () => {
    const limit = "You've used today's 10 replies. Echo will be back tomorrow.";
    fetchMock.mockResolvedValueOnce(
      new Response(limit, { headers: headers("limit") }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={done()} edited />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate reply" }));
    expect(await screen.findByText(limit, { selector: VISIBLE })).toBeVisible();
    expect(screen.getByText(/A quiet flat after a loud month/)).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Open entry from/ }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Regenerate reply" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("keeps the reply when a regenerate fails, with a way to retry", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "down" }, { status: 502 }),
    );
    render(<ReflectionPanel entryId="e1" initialReflection={done()} edited />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate reply" }));
    expect(
      await screen.findByText(
        "Echo couldn't reply right now. Your entry is saved.",
        { selector: VISIBLE },
      ),
    ).toBeVisible();
    expect(screen.getByText(/A quiet flat after a loud month/)).toBeVisible();

    fetchMock.mockResolvedValueOnce(
      new Response("Second try.", { headers: headers("streaming", []) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Second try.")).toBeVisible();
    expect(lastBody()).toEqual({ entryId: "e1", regenerate: true });
  });
});
