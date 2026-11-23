import { HeartHandshake } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const linkClass =
  "font-medium text-primary underline underline-offset-3 hover:text-foreground";

/**
 * Shown instead of Echo's reply when an entry contains crisis phrases:
 * calm (no red), points to people who can help now (design.md: CrisisCard).
 */
export function CrisisCard() {
  return (
    <Alert className="gap-y-2 rounded-md border-border bg-card px-6 py-5 text-base has-[>svg]:gap-x-3 sm:px-8 sm:py-6 *:[svg]:size-5 *:[svg]:text-primary">
      <HeartHandshake aria-hidden="true" />
      <AlertTitle className="font-heading text-lg font-medium">
        You don’t have to carry this alone
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-base text-card-foreground md:text-pretty">
        <p className="mb-0!">
          It sounds like you’re going through something really painful. Echo
          isn’t a therapist and can’t help in a crisis — but people can, right
          now.
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            If you’re in immediate danger, call your local emergency number.
          </li>
          <li>
            US: call or text{" "}
            <a href="tel:988" className={linkClass}>
              988
            </a>{" "}
            (Suicide &amp; Crisis Lifeline).
          </li>
          <li>
            UK and Ireland: call Samaritans on{" "}
            <a href="tel:116123" className={linkClass}>
              116 123
            </a>
            .
          </li>
          <li>
            Anywhere else:{" "}
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              findahelpline.com
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            lists free, confidential helplines.
          </li>
        </ul>
        <p className="text-muted-foreground">Your entry is saved.</p>
      </AlertDescription>
    </Alert>
  );
}
