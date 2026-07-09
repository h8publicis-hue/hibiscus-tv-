import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-hibiscus-500 focus:border-transparent transition-shadow",
          error && "border-red-400 focus:ring-red-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-hibiscus-500 focus:border-transparent transition-shadow resize-y min-h-[90px]",
          error && "border-red-400 focus:ring-red-500",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-hibiscus-500 focus:border-transparent transition-shadow",
          error && "border-red-400 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-slate-700",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-hibiscus-600 ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
