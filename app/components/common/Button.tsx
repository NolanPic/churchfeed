import Link from "next/link";
import styles from "./Button.module.css";
import Icon from "./Icon";

interface BaseButtonProps {
  children?: React.ReactNode;
  icon?: React.ReactNode | string;
  className?: string;
  disabled?: boolean;
  color?: "primary" | "none";
  iconSize?: number;
}

interface ButtonAsButton extends BaseButtonProps {
  as?: "button";
  onClick?: () => void;
  type?: "button" | "submit";
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps {
  as: "link";
  href: string;
  onClick?: never;
  type?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button: React.FC<ButtonProps> = ({
  children,
  icon,
  className = "",
  disabled = false,
  color = "primary",
  iconSize,
  ...props
}) => {
  const hasChildren = !!children;
  const colorClassName = color === "none" ? styles.colorNone : "";
  const iconOnlyClassName = !hasChildren ? styles.iconOnly : "";
  const baseClassName =
    `${styles.button} ${colorClassName} ${iconOnlyClassName} ${className}`.trim();

  const ButtonContent = () => (
    <>
      {hasChildren && <span>{children}</span>}
      {icon && (
        <>
          {typeof icon === "string" ? (
            <Icon className={styles.icon} name={icon} size={iconSize} />
          ) : (
            icon
          )}
        </>
      )}
    </>
  );

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        className={baseClassName}
        aria-disabled={disabled}
      >
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={disabled}
      className={baseClassName}
    >
      <ButtonContent />
    </button>
  );
};

export default Button;
