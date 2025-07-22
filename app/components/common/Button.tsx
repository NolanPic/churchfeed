import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

interface BaseButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface ButtonAsButton extends BaseButtonProps {
  as?: 'button';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps {
  as: 'link';
  href: string;
  onClick?: never;
  type?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button: React.FC<ButtonProps> = ({
  children,
  icon,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClassName = `${styles.button} ${className}`;

  if (props.as === 'link') {
    return (
      <Link 
        href={props.href} 
        className={baseClassName}
        aria-disabled={disabled}
      >
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={disabled}
      className={baseClassName}
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;