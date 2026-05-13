export interface BookPage {
  bookName: string;
  pageNumber: number;
  fileName: string;
  url: string;
}

export interface BookDetail {
  bookName: string;
  pageCount: number;
  iconUrl?: string;
  pages: BookPage[];
}

export interface BookSummary {
  name: string;
  pages: number;
  iconUrl?: string;
}

export interface MaskType {
  start: string;
  end: string;
}

export interface MetaDataType {
  page: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface BookOcrSummary {
  name: string;
  pages: number;
  iconUrl?: string;
  masks: MaskType;
  matches: Record<string, MetaDataType>;
}

export interface BookUploadProgress {
  bookName: string;
  totalPages: number;
  currentPage: number;
}
