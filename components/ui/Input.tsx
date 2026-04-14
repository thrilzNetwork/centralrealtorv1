import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="label-caps text-[#6B7565]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full border border-[#D8D3C8] bg-white px-4 py-3 text-sm text-[#262626]",
            "rounded-sm placeholder:text-[#ACBFA4]",
            "transition-colors duration-150",
            "focus:outline-none focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/20",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B7565]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
