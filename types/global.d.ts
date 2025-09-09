declare global {
  var TEST_ORG_HOST: string;
  interface ImageDropOptions {
    accept?: string;
    upload: (file: File) => Promise<string>;
    onError?: (error: Error) => void;
  }
}

export {}; 