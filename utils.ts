import { Paper, RawPaper } from './types';

// Global counter for fallback ID generation to ensure uniqueness in tight loops
let uniqueCounter = 0;

// Helper to generate a robust unique ID
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: Date + Counter + Random
  uniqueCounter = (uniqueCounter + 1) % 9999;
  return `id_${Date.now().toString(36)}_${uniqueCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to extract URLs from text
export const extractLinks = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)|(arXiv:\d+\.\d+)|(github\.com\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches : [];
};

// Helper: Loose parser for JS-style objects (handles single quotes, trailing commas, etc.)
const looseParse = (input: string): any => {
  try {
    // SECURITY WARNING: In a public app, use a library like 'json5'. 
    // For this local workspace, Function constructor is acceptable to parse JS objects.
    // It allows inputs like: { key: 'value', } (no quotes on key, single quotes, trailing comma)
    return new Function('"use strict";return (' + input + ')')();
  } catch (e) {
    throw new Error("Failed to parse loosely: " + e);
  }
};

// Robust parser for the specific nested JSON structure provided by the user
export const parseRawJson = (input: string): Paper[] => {
  let parsed: any;
  
  // 1. Attempt strict JSON parse
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    // 2. Fallback: Attempt loose JS object parse
    try {
      console.warn("Strict parse failed, attempting loose parse...");
      parsed = looseParse(input);
    } catch (e2) {
      console.error("All parsing attempts failed.", e);
      return [];
    }
  }

  let rawPapers: RawPaper[] = [];

  // Strategy: Traverse and find arrays that look like our target data
  const traverse = (node: any) => {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object') {
      // Check if this object is a wrapper like { "data": [...] }
      if (node.data && Array.isArray(node.data)) {
        node.data.forEach(traverse);
      }
      
      // Check if this object has an "output" string that contains JSON
      if (typeof node.output === 'string') {
        try {
          let innerJson: any;
          // Try strict parse first for the inner string
          try {
            innerJson = JSON.parse(node.output);
          } catch {
            // Fallback to loose parse for inner string
            // This fixes issues where the string content has unescaped characters
            innerJson = looseParse(node.output);
          }
          
          if (Array.isArray(innerJson)) {
            rawPapers = [...rawPapers, ...innerJson];
          }
        } catch (e) {
          // Ignore parse errors for non-JSON strings
        }
      }

      // If the object itself looks like a paper (fallback)
      if (node["Título"] || node["Resumen Ejecutivo"]) {
        rawPapers.push(node);
      }
    }
  };

  try {
    traverse(parsed);

    // Transform RawPaper to internal Paper structure
    return rawPapers.map((rp) => {
      const combinedText = `${rp["Resumen Ejecutivo"] || ''} ${rp["Conclusión/Aporte Clave"] || ''}`;
      
      // Extract links from text
      let links = extractLinks(combinedText);
      
      // Check for explicit link fields in the raw JSON and add them to the START of the list
      // This supports fields like "url", "link", "doi", "pdf", etc.
      const explicitLink = rp["url"] || rp["link"] || rp["URL"] || rp["href"] || rp["doi"];
      if (explicitLink && typeof explicitLink === 'string') {
          // If it doesn't start with http/https, maybe prepend it (unless it's just a raw doi)
          let cleanLink = explicitLink.trim();
          if (!cleanLink.startsWith('http') && !cleanLink.startsWith('arXiv')) {
             // Simple heuristic, if it looks like a domain, add protocol
             if (cleanLink.includes('www') || cleanLink.includes('.com') || cleanLink.includes('.org')) {
                cleanLink = 'https://' + cleanLink;
             }
          }
          // Add to front so it becomes the primary link for the title
          links.unshift(cleanLink);
      }

      // Deduplicate links
      links = [...new Set(links)];

      return {
        id: generateId(), // Guaranteed unique
        title: rp["Título"] || "Untitled Paper",
        year: rp["Año"] ? String(rp["Año"]) : "N/D",
        tags: Array.isArray(rp["Etiquetas"]) ? rp["Etiquetas"] : [],
        summary: rp["Resumen Ejecutivo"] || "No summary provided.",
        contribution: rp["Conclusión/Aporte Clave"] || "",
        userNotes: "",
        isImportant: false,
        links: links
      };
    });
  } catch (error) {
    console.error("Error during traversal/mapping", error);
    return [];
  }
};

export const downloadJson = (data: object, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename + ".json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};