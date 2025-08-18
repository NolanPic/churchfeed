import { useEffect } from "react";

export default function useHistoryRouter(onHistoryChange: (path: string) => void) {
    useEffect(() => {
      const onPopState = () => {
        const newPath = window.location.pathname;
        onHistoryChange(newPath);
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }, [onHistoryChange]);

    return {
      push: (path: string) => {
          window.history.pushState(null, "", path);
      }
    };
}
