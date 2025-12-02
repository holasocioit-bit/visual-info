export interface RawPaper {
  "Título"?: string;
  "Año"?: number | string;
  "Etiquetas"?: string[];
  "Resumen Ejecutivo"?: string;
  "Conclusión/Aporte Clave"?: string;
  [key: string]: any;
}

export interface Paper {
  id: string;
  title: string;
  year: string;
  tags: string[];
  summary: string;
  contribution: string;
  // User added fields
  userNotes: string;
  isImportant: boolean;
  links: string[]; // Extracted URLs or identifiers
}

export interface Sheet {
  id: string;
  title: string;
  createdAt: number;
  papers: Paper[];
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  ANALYTICS = 'ANALYTICS'
}
