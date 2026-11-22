import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

interface WeekNavProps {
  previousWeek: string;
  /** null when this is the current week. */
  nextWeek: string | null;
}

export function WeekNav({ previousWeek, nextWeek }: WeekNavProps) {
  return (
    <nav aria-label="Week" className="flex flex-wrap gap-1">
      <Link
        href={routes.week(previousWeek)}
        className={buttonVariants({ variant: "ghost" })}
      >
        <ArrowLeft aria-hidden="true" />
        Previous week
      </Link>
      {nextWeek ? (
        <Link
          href={routes.week(nextWeek)}
          className={buttonVariants({ variant: "ghost" })}
        >
          Next week
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <Button variant="ghost" disabled>
          Next week
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </nav>
  );
}
