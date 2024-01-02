/// <reference types="vite/client" />

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}