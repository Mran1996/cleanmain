// Minimal type shim for formidable to satisfy TypeScript
declare module 'formidable' {
  const formidable: any;
  export default formidable;
}