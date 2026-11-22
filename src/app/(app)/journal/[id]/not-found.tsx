import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function EntryNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
      <h1 className="font-heading text-3xl font-medium">Entry not found</h1>
      <p className="text-muted-foreground">
        This entry doesn&apos;t exist or was deleted.
      </p>
      <Link href={routes.journal} className={buttonVariants({ size: "lg" })}>
        Back to your journal
      </Link>
    </div>
  );
}
