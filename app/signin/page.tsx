import { Button } from "@/app/components/common/Button";
import { Input } from "@/app/components/common/Input";
import styles from "./page.module.css";

export default function SignIn() {
  return (
    <main>
      <div className={styles.signinCard}>
        <h1>Sign in</h1>
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          className={styles.signinInput}
        />
        <Button className={styles.signinButton} icon="send">
          Continue
        </Button>
      </div>
    </main>
  );
}
