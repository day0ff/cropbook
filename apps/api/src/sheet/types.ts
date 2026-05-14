export type CreateSheetOptions = {
  bookName: string;
  regexp: string;
  items: Array<string>;
  outputFileName?: string;
  returnBuffer?: boolean;
};
