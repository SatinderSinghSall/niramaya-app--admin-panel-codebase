export interface DatabaseCollection {
  name: string;
  documents: number;
}

export interface DatabaseCollectionsResponse {
  collections: DatabaseCollection[];
}

export interface DatabaseIndex {
  name: string;
  key: Record<string, number>;
  unique: boolean;
  sparse: boolean;
}

export interface DatabaseCollectionOverview {
  name: string;
  documents: number;
  indexes: DatabaseIndex[];
}

export interface DatabaseDocument {
  _id: string;
  [key: string]: unknown;
}

export interface DatabasePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DatabaseSort {
  field: string;
  order: "asc" | "desc";
}

export interface DatabaseDocumentsResponse {
  collection: string;
  documents: DatabaseDocument[];
  pagination: DatabasePagination;
  sort: DatabaseSort;
}

export interface DatabaseDocumentResponse {
  document: DatabaseDocument;
}

export interface DatabaseSchemaField {
  field: string;
  types: string[];
  occurrences: number;
  examples: unknown[];
}

export interface DatabaseSchemaResponse {
  collection: string;
  sampledDocuments: number;
  totalDocuments: number;
  fields: DatabaseSchemaField[];
}

export interface DatabaseDeleteResponse {
  deleted: boolean;
  id: string;
}
