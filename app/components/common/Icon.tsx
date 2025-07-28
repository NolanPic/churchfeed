import styles from "./Icon.module.css";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  className = "",
  alt = "",
}) => {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={`${styles.icon} ${className}`}
    />
  );
};

export default Icon;
