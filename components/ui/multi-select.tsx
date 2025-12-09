"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  badge?: {
    text: string;
    className?: string;
  };
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  className,
  popoverClassName,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const selectedOptions = options.filter((option) => value.includes(option.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-2xl h-auto min-h-10 py-2",
            !value.length && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {value.length > 0
              ? selectedOptions.map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                  >
                    {option.name}
                  </span>
                ))
              : placeholder}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[450px] p-0", popoverClassName)}
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className="max-h-[320px] overflow-y-auto p-2 overscroll-contain"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--border)) transparent",
          }}
        >
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.id);
              const hasImage = !!option.imageUrl;
              const hasDescription = !!option.description;

              return (
                <div
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-2 mb-2 transition-colors",
                    "hover:bg-primary/20 hover:border-accent-foreground/20",
                    isSelected && "bg-primary/20 border-primary"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-x-3 flex-1">
                      {hasImage && (
                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={option.imageUrl}
                            alt={option.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-none flex items-center gap-2">
                          {option.name}
                          {option.badge && (
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded",
                                option.badge.className ||
                                  "bg-primary/80 text-white"
                              )}
                            >
                              {option.badge.text}
                            </span>
                          )}
                        </div>
                        {hasDescription && (
                          <div className="text-xs text-muted-foreground leading-snug mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
