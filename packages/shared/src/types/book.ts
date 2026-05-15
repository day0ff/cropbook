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
  masks?: string[];
  pages: BookPage[];
}

export interface BookSummary {
  name: string;
  pages: number;
  iconUrl?: string;
}

export interface MetaDataType {
  page: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface PageMetadataItem {
  key: string;
  value: MetaDataType;
}

export interface PageMetadataResponse {
  masks: string[];
  metadataByMask: Record<string, PageMetadataItem[]>;
}

export interface BookUploadProgress {
  bookName: string;
  totalPages: number;
  currentPage: number;
}
