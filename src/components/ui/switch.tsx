import * as React from "react";
import { cn } from "../../lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  label?: React.ReactNode;
};

// Lightweight, dependency-free Switch styled like shadcn/ui
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, disabled, onCheckedChange, className, label }, ref) => {
    const [internal, setInternal] = React.useState<boolean>(!!defaultChecked);
    const isControlled = typeof checked === "boolean";
    const value = isControlled ? !!checked : internal;

    const toggle = () => {
      if (disabled) return;
      const next = !value;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-pressed={value}
        aria-disabled={disabled}
        className={cn(
          "group inline-flex items-center gap-3 select-none",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <span
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-200",
            value ? "bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6]" : "bg-white/10",
            "ring-1 ring-inset ring-white/10"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
              value ? "translate-x-5" : "translate-x-0"
            )}
          />
        </span>
        {label && (
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
        )}
      </button>
    );
  }
);
Switch.displayName = "Switch";

export default Switch;
