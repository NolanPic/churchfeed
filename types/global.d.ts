declare global {
  var TEST_ORG_HOST: string;
  interface ImageDropOptions {
    accept?: string;
    onError?: (error: Error) => void;
  }
}

export {}; 