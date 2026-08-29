/// <reference types="nativewind/types" />

// Lets TypeScript accept `import "./global.css"` (the Tailwind entry point).
// Metro handles the actual CSS via the NativeWind plugin at build time.
declare module "*.css";
