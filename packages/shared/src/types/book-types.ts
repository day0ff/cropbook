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
  name: string;
  pages: number;
  iconUrl?: string;
}

export interface BookUploadProgress {
  bookName: string;
  totalPages: number;
  currentPage: number;
}
