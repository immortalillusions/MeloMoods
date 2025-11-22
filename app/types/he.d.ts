declare module "he" {
  const decode: (input: string) => string;
  const encode: (input: string) => string;
  export { decode, encode };
  export default { decode, encode };
}