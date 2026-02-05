export enum SapFileLangs {
  es = 'Spanish',
  en = 'English',
  pt = 'Portuguese',
  fr = 'French'
}

export const SAP_FILE_LANGS = Object.entries(SapFileLangs).map(([code, name]) => ({ code, name }));
