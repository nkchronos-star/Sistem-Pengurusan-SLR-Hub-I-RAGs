import Papa from "papaparse";
import { SLRData, SLRProtocol, SLRResearchQuestion, SLRMetadata } from "../types";

export const parseSLRCSV = (file: File): Promise<SLRData> => {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: false, // We need to keep empty lines to identify sections potentially, or we can handle it
      complete: (results) => {
        try {
          const rows = results.data;
          
          let title = "";
          let subtitle = "";
          const protocols: SLRProtocol[] = [];
          const researchQuestions: SLRResearchQuestion[] = [];
          const metadata: SLRMetadata[] = [];
          
          // Current section tracking
          let currentSection = "HEADER"; 
          // 'HEADER', 'PROTOCOLS', 'RQS', 'METADATA'

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip completely empty rows
            if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
              currentSection = "METADATA"; // Reset to general metadata if we hit a blank line after a section
              continue;
            }
            
            const col1 = row[0]?.trim() || "";
            const col2 = row[1]?.trim() || "";
            
            // If it's a completely empty line (all commas)
            if (!col1 && !col2) {
              currentSection = "METADATA";
              continue;
            }

            if (i === 0 && currentSection === "HEADER") {
              title = col1;
              subtitle = col2;
              currentSection = "METADATA";
              continue;
            }

            // Detect Protocol Section
            if (col1 === "Komponen" && col2 === "Ketetapan Protokol") {
              currentSection = "PROTOCOLS";
              continue;
            }

            // Detect RQ Section
            if (col1 === "SLR-RQ" && col2 === "Soalan Kajian") {
              currentSection = "RQS";
              continue;
            }

            // Process based on current section
            if (currentSection === "PROTOCOLS") {
              if (col1 && col2) {
                protocols.push({ component: col1, setting: col2 });
              }
            } else if (currentSection === "RQS") {
              if (col1 && col2) {
                researchQuestions.push({ id: col1, question: col2 });
              }
            } else {
              // Metadata or other key-value pairs
              if (col1 && col2) {
                metadata.push({ key: col1, value: col2 });
              }
            }
          }

          resolve({
            title,
            subtitle,
            protocols,
            researchQuestions,
            metadata,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
