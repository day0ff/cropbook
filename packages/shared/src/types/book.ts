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

export type RawMetaDataType ={
  page: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  isCompleted?: boolean;
  isVerified?: boolean;
}

export type MetaDataType = RawMetaDataType & {
  additional?: RawMetaDataType
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

type BookName = string;
type Mask = string;
type Exercise = string;
export type TaskType = {
  isCompleted: boolean;
  isVerified: boolean;
  orderNumber: number;
  exercise: Array<Exercise>;
  date?: Date;
  notes?: string;
}

export type SchemasType = Record<BookName, Record<Mask, Array<TaskType>>>
