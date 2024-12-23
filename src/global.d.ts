declare global {
    interface Window {
      Jupiter: {
        init: (config: { containerId: string; endpoint: string }) => void;
      };
    }
  }
  