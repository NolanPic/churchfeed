import Button, { ButtonProps } from "./Button";
import styles from "./IconButton.module.css";
import classNames from "classnames";

type IconButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: "primary" | "default";
  label?: string;
  size?: number;
};

export default function IconButton({
  icon,
  variant = "default",
  label,
  size = 56,
  iconSize = 24,
  className = "",
  ariaLabel,
  ...props
}: IconButtonProps) {
  const classes = classNames(
    styles.iconButton,
    variant === "default" ? styles.defaultVariant : styles.primaryVariant,
    className
  );

  const buttonVariant: ButtonProps["variant"] =
    variant === "primary" ? "primary" : "none";

  return (
    <span style={{ ["--iconButtonSize" as unknown as string]: `${size}px` }}>
      <Button
        {...(props as ButtonProps)}
        icon={icon}
        iconSize={iconSize}
        variant={buttonVariant}
        ariaLabel={ariaLabel || label}
        className={classes}
      >
        {label}
      </Button>
    </span>
  );
}
