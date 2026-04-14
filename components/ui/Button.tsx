import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-body font-500 tracking-wide transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[#FF7F11] text-white hover:bg-[#CC6500] active:scale-[0.98] focus-visible:outline-[#FF7F11]",
      secondary:
        "bg-[#262626] text-white hover:bg-[#323232] active:scale-[0.98] focus-visible:outline-[#262626]",
      ghost:
        "bg-transparent text-[#262626] hover:bg-[#E2E8CE] active:scale-[0.98]",
      outline:
        "bg-transparent border border-[#262626] text-[#262626] hover:bg-[#262626] hover:text-white active:scale-[0.98]",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] focus-visible:outline-red-600",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-sm",
      md: "px-5 py-2.5 text-sm rounded-sm",
      lg: "px-7 py-3.5 text-base rounded-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Cargando...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
