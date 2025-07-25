import { useId, forwardRef } from "react";
import styles from "./Input.module.css";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  type?: "text" | "email" | "number";
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = "text",
      error,
      helperText,
      required = false,
      disabled = false,
      placeholder,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const inputId = id || `input-${useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;

    const hasError = Boolean(error);

    return (
      <div className={`${styles.inputWrapper} ${className || ""}`}>
        <label
          htmlFor={inputId}
          className={`${styles.label} ${disabled ? styles.disabled : ""}`}
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            [errorId, helperTextId].filter(Boolean).join(" ") || undefined
          }
          className={`${styles.input} ${hasError ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
          {...props}
        />

        {helperText && !error && (
          <div id={helperTextId} className={styles.helperText}>
            {helperText}
          </div>
        )}

        {error && (
          <div id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
