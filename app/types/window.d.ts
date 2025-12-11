export {};

declare global {
  interface Window {
    __churchfeed?: {
      showNotification?: (title: string, body: string) => Promise<void>;
    };
  }
}
