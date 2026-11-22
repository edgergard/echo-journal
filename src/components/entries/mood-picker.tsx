"use client";

import { useId } from "react";

import { type Mood, MOODS } from "@/contracts/journal";
import { cn } from "@/lib/utils";

import { MOOD_LABELS } from "./mood";

interface MoodPickerProps {
  value: Mood | undefined;
  onChange: (mood: Mood) => void;
  invalid?: boolean;
  /** id of the element that describes the error. */
  errorId?: string;
  disabled?: boolean;
}

/** Five moods as a radio group; the word is always visible. */
export function MoodPicker({
  value,
  onChange,
  invalid,
  errorId,
  disabled,
}: MoodPickerProps) {
  const name = useId();
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      disabled={disabled}
    >
      <legend className="mb-2 text-sm font-medium text-muted-foreground">
        How are you feeling?
      </legend>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <label
            key={mood}
            className={cn(
              "relative cursor-pointer rounded-lg border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50",
              invalid && "border-destructive",
            )}
          >
            <input
              type="radio"
              name={name}
              value={mood}
              checked={value === mood}
              onChange={() => onChange(mood)}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            {MOOD_LABELS[mood]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
