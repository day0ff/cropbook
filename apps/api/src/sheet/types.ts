export type CreateSheetOptions = {
  bookName: string;
  regexp: string;
  items: Array<string>;
  outputFileName?: string;
  returnBuffer?: boolean;
};

export type CreatePagesOptions = {
  bookName: string;
  regexp: string;
  pages: string;
  returnBuffer?: boolean;
};