import type { JSONContent } from "@tiptap/core";

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
};

export type DocumentContent = {
  type: "doc";
  content: JSONContent[];
};

export type Document = {
  id: string;
  owner_id: string;
  title: string;
  content: DocumentContent;
  version: number;
  created_at: Date;
  updated_at: Date;
};

export type SharedDocument = Document & {
  owner_name: string;
};

export type ShareUser = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
};
