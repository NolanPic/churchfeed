import { useId, forwardRef, useState, useCallback } from "react";
import styles from "./Input.module.css";
import {
  validateTextField,
  validateEmailField,
  validateNumberField,
  TextFieldValidationOptions,
} from "@/validation";

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
  validationConfig?: TextFieldValidationOptions;
  fieldName?: string;
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
      validationConfig,
      fieldName,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalError, setInternalError] = useState<string>("");

    // Generate unique IDs for accessibility
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error || internalError ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;

    // Validation handler
    const handleValidation = useCallback(
      (value: string) => {
        if (!validationConfig) return;

        const name = fieldName || label;
        let result;

        if (type === "email") {
          result = validateEmailField(value, validationConfig, name);
        } else if (type === "number") {
          result = validateNumberField(value, validationConfig, name);
        } else {
          result = validateTextField(value, validationConfig, name);
        }

        if (!result.valid && result.errors.length > 0) {
          setInternalError(result.errors[0].message);
        } else {
          setInternalError("");
        }
      },
      [validationConfig, fieldName, label, type]
    );

    // Handle blur event
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (validationConfig) {
          handleValidation(e.target.value);
        }
        onBlur?.(e);
      },
      [validationConfig, handleValidation, onBlur]
    );

    const displayError = error || internalError;
    const hasError = Boolean(displayError);

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
          onBlur={handleBlur}
          {...props}
        />

        {helperText && !displayError && (
          <div id={helperTextId} className={styles.helperText}>
            {helperText}
          </div>
        )}

        {displayError && (
          <div id={errorId} className={styles.errorMessage} role="alert">
            {displayError}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
