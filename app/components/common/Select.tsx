"use client";

import { useId, forwardRef, useState, useRef, useEffect } from "react";
import styles from "./Select.module.css";
import Icon from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  options?: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  prependToSelected?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      defaultValue,
      onChange,
      error,
      helperText,
      disabled = false,
      placeholder = "Select an option",
      prependToSelected,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const selectRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Support both controlled and uncontrolled modes
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Generate unique IDs for accessibility
    const generatedId = useId();
    const selectId = `select-${generatedId}`;
    const listboxId = `${selectId}-listbox`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperTextId = helperText ? `${selectId}-helper` : undefined;

    // Generate ID for the currently focused option
    const focusedOptionId =
      focusedIndex >= 0 ? `${selectId}-option-${focusedIndex}` : undefined;

    const hasError = Boolean(error);
    const selectedOption = options?.find(
      (option) => option.value === currentValue
    );

    // Generate display text and tooltip for selected option
    const selectedDisplayText = selectedOption
      ? `${prependToSelected || ""}${selectedOption.label}`
      : placeholder;
    const selectedTooltip = selectedOption
      ? `${prependToSelected || ""}${selectedOption.label}`
      : undefined;

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            const option = options?.[focusedIndex];
            handleOptionSelect(option?.value ?? "");
          } else {
            setIsOpen(!isOpen);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0); // Start at first option when opening
          } else {
            const nextIndex = Math.min(
              focusedIndex + 1,
              (options?.length ?? 0) - 1
            );
            setFocusedIndex(nextIndex);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (isOpen) {
            const prevIndex = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prevIndex);
          }
          break;
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      if (!isControlled) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
      selectRef.current?.focus();
    };

    const handleOptionClick = (option: SelectOption) => {
      handleOptionSelect(option.value);
    };

    return (
      <div className={`${styles.selectWrapper} ${className || ""}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`${styles.label} ${disabled ? styles.disabled : ""}`}
          >
            {label}
          </label>
        )}

        <div className={styles.selectContainer} ref={containerRef}>
          <button
            ref={ref || selectRef}
            id={selectId}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-activedescendant={
              isOpen && focusedOptionId ? focusedOptionId : undefined
            }
            aria-label={!label ? placeholder : undefined}
            aria-labelledby={label ? selectId : undefined}
            aria-describedby={
              [errorId, helperTextId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={hasError}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`${styles.select} ${hasError ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
            {...props}
          >
            <span className={styles.selectText} title={selectedTooltip}>
              {selectedDisplayText}
            </span>
            <span className={styles.icon} aria-hidden="true">
              <Icon name="dropdown-arrow" size={10} />
            </span>
          </button>

          {isOpen && !disabled && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={selectId}
              className={styles.optionsList}
            >
              {options?.map((option, index) => (
                <li
                  key={option?.value}
                  id={`${selectId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === currentValue}
                  title={option.label}
                  className={`${styles.option} ${
                    option.value === currentValue ? styles.selected : ""
                  } ${index === focusedIndex ? styles.focused : ""}`}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className={styles.optionText}>{option.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

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

Select.displayName = "Select";

export default Select;
