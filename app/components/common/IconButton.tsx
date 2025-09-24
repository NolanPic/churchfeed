import Button, { ButtonProps } from "./Button";
import styles from "./IconButton.module.css";
import classNames from "classnames";

type IconButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: "primary" | "default";
  label?: string;
  size?: number;
  popoverTarget?: string;
};

export default function IconButton({
  icon,
  variant = "default",
  label,
  size = 56,
  iconSize = 24,
  className = "",
  ariaLabel,
  popoverTarget,
  ...props
}: IconButtonProps) {
  const classes = classNames(
    styles.iconButton,
    variant === "default" ? styles.defaultVariant : styles.primaryVariant,
    label && styles.hasLabel,
    className
  );

  const buttonVariant: ButtonProps["variant"] =
    variant === "primary" ? "primary" : "none";

  type IconButtonStyle = React.CSSProperties &
    Record<"--iconButtonSize", string>;
  const iconButtonStyle: IconButtonStyle = { "--iconButtonSize": `${size}px` };

  return (
    <Button
      {...(props as ButtonProps)}
      icon={icon}
      iconSize={iconSize}
      variant={buttonVariant}
      ariaLabel={ariaLabel || label}
      className={classes}
      style={iconButtonStyle}
      popoverTarget={popoverTarget}
    >
      {label}
    </Button>
  );
}
