/** Minimal Node typings for unit tests. The app itself runs in the browser. */
declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

declare const process: {
  env: {
    FRETWORK_SAMPLE_CSV?: string;
  };
};
