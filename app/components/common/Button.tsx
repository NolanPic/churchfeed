import Link from "next/link";
import styles from "./Button.module.css";
import Icon from "./Icon";

interface BaseButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode | string;
  className?: string;
  disabled?: boolean;
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
  ...props
}) => {
  const baseClassName = `${styles.button} ${className}`;

  const ButtonContent = () => (
    <>
      <span>{children}</span>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {typeof icon === "string" ? <Icon name={icon} /> : icon}
        </span>
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
