export interface BookPage {
  bookName: string;
  pageNumber: number;
  fileName: string;
  url: string;
}

export interface BookDetail {
  bookName: string;
  pageCount: number;
  pages: BookPage[];
}

export interface BookSummary {
  bookName: string;
  pageCount: number;
}
