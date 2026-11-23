import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  DemoSignIn,
  EmailLinkResult,
  GitHubSignInResult,
  SendEmailLink,
  SignInWithGitHub,
} from "./auth-schema";
import { AuthForm } from "./auth-form";

function setup({
  emailResult = { status: "sent", email: "sam@example.com" },
  gitHubResult = { status: "not-configured" },
  callbackFailed = false,
}: {
  emailResult?: EmailLinkResult;
  gitHubResult?: GitHubSignInResult;
  callbackFailed?: boolean;
} = {}) {
  const sendEmailLink = vi.fn<SendEmailLink>(async () => emailResult);
  const signInWithGitHub = vi.fn<SignInWithGitHub>(async () => gitHubResult);
  const signInDemo = vi.fn<DemoSignIn>(async () => ({ status: "idle" }));
  render(
    <AuthForm
      next="/week"
      sendEmailLink={sendEmailLink}
      signInWithGitHub={signInWithGitHub}
      signInDemo={signInDemo}
      callbackFailed={callbackFailed}
    />,
  );
  const email = screen.getByLabelText("Email");
  const submit = screen.getByRole("button", { name: "Email me a link" });
  return { sendEmailLink, signInWithGitHub, email, submit };
}

describe("AuthForm", () => {
  it("asks for an email before sending", async () => {
    const { sendEmailLink, email, submit } = setup();
    fireEvent.click(submit);
    expect(
      await screen.findByText("Enter your email address."),
    ).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter your email address.");
    expect(sendEmailLink).not.toHaveBeenCalled();
  });

  it("rejects an invalid email at the field", async () => {
    const { sendEmailLink, email, submit } = setup();
    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.click(submit);
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    expect(sendEmailLink).not.toHaveBeenCalled();
  });

  it("sends the link and shows the sent state", async () => {
    const { sendEmailLink, email, submit } = setup();
    fireEvent.change(email, { target: { value: "  sam@example.com " } });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Check your inbox — we sent a link to sam@example.com.",
      ),
    );
    expect(sendEmailLink).toHaveBeenCalledWith({
      email: "sam@example.com",
      next: "/week",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Use a different email" }),
    );
    const emailAgain = await screen.findByLabelText("Email");
    expect(emailAgain).toHaveValue("");
    await waitFor(() => expect(emailAgain).toHaveFocus());
  });

  it("explains that email sign-in is off in the demo preview", async () => {
    const { email, submit } = setup({
      emailResult: { status: "not-configured" },
    });
    fireEvent.change(email, { target: { value: "sam@example.com" } });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Email sign-in isn't set up in this preview. Try the demo instead.",
      ),
    );
  });

  it("shows the service error", async () => {
    const { email, submit } = setup({ emailResult: { status: "error" } });
    fireEvent.change(email, { target: { value: "sam@example.com" } });
    fireEvent.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't send the link. Check the address and try again.",
    );
  });

  it("explains that GitHub sign-in is off in the demo preview", async () => {
    const { signInWithGitHub } = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with GitHub" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Email sign-in isn't set up in this preview. Try the demo instead.",
      ),
    );
    expect(signInWithGitHub).toHaveBeenCalledWith({ next: "/week" });
  });

  it("offers the demo and reports a failed callback", () => {
    setup({ callbackFailed: true });
    expect(
      screen.getByRole("button", { name: "Try the demo instead" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That sign-in link didn't work",
    );
  });

  it("hides the email form when email sign-in is off", () => {
    render(
      <AuthForm
        next="/week"
        emailEnabled={false}
        sendEmailLink={vi.fn<SendEmailLink>()}
        signInWithGitHub={vi.fn<SignInWithGitHub>()}
        signInDemo={vi.fn<DemoSignIn>()}
      />,
    );
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with GitHub" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try the demo instead" }),
    ).toBeInTheDocument();
  });
});
