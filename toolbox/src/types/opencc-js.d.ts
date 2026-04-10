declare module 'opencc-js' {
  export type OpenCCLocale = 'cn' | 'tw' | 'twp' | 'hk' | 'jp' | 't'
  export type ConverterOptions = {
    from: OpenCCLocale
    to: OpenCCLocale
  }

  export function Converter(options: ConverterOptions): (input: string) => string
}
