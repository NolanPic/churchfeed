import classNames from "classnames";
import styles from "./Hint.module.css";

export default function Hint({
  type,
  children,
}: {
  type: "info" | "warn" | "error";
  children: React.ReactNode;
}) {
  const icon = {
    error: "❌",
    info: "💡",
    warn: "⚠️",
  }[type];

  return (
    <div className={classNames(styles.hint, styles[type])}>
      <div className={styles.hintContent}>
        {icon && <span>{icon}</span>}
        {children}
      </div>
    </div>
  );
}
