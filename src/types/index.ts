export type Folder = {
  id: string;
  name: string;
  color: string;
  systemKey?: string;
};
export type Ad = {
  id: string;
  name: string;
  type: "image" | "video";
  folderId: string;
  date: string;
  size: string;
  design?: string;
  url?: string;
  local?: boolean;
  storagePath?: string;
  unavailable?: boolean;
};
