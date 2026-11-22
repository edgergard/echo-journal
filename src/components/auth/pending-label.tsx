import { LoaderCircle } from "lucide-react";

/**
 * Button content with an optional spinner. The `id` lets the button use
 * `aria-labelledby`, so screen readers pick up label changes while it keeps
 * focus (Base UI `focusableWhenDisabled`).
 */
export function PendingLabel({
  id,
  pending,
  children,
}: {
  id: string;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : null}
      <span id={id}>{children}</span>
    </>
  );
}
