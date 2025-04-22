interface MathJaxObject {
  typesetPromise?: () => Promise<any>;
  typeset?: (elements?: HTMLElement[]) => void;
  tex?: {
    inlineMath: string[][];
    displayMath: string[][];
    processEscapes: boolean;
    processEnvironments: boolean;
  };
  options?: {
    skipHtmlTags: string[];
  };
}

declare global {
  interface Window {
    MathJax: MathJaxObject;
  }
}

export {};