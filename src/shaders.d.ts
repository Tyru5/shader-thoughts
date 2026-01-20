declare module '../shaders/index.js' {
  interface Shader {
    fragment: string;
    vertex?: string;
  }
  
  export const shaders: Record<string, Shader>;
}
