export interface SLRProtocol {
  component: string;
  setting: string;
}

export interface SLRResearchQuestion {
  id: string;
  question: string;
}

export interface SLRMetadata {
  key: string;
  value: string;
}

export interface BilingualText {
  bm: string;
  en: string;
}

export type ArticlePriority = 'A-TERAS' | 'B-SOKONGAN' | 'C-LATAR' | 'Belum Ditetapkan';
export type ArticleStatus = 'NEW' | 'TO_READ' | 'READING' | 'EXTRACTED' | 'CITED';

export interface ResearchProfile {
  title: string;
  keywords: string;
}

export interface ArticleAnalysis {
  id: string;
  title: string;
  authors: string;
  year: string;
  doi?: string;
  journal?: string;
  isPredatory?: boolean;
  predatoryWarning?: string;
  autoPriority?: 'A-TERAS' | 'B-SOKONGAN' | 'REJECT';
  rejectReason?: string;
  needsReevaluation?: boolean;
  summary: BilingualText | string;
  background?: BilingualText | string;
  problemStatement?: BilingualText | string;
  methodology: BilingualText | string;
  findings?: BilingualText | string;
  futureResearch?: BilingualText | string;
  researchGap: BilingualText | string;
  slrRelevance: BilingualText | string;
  priority?: ArticlePriority;
  status?: ArticleStatus;
  thesisSection?: string;
  pdfUrl?: string;
}

export interface SLRData {
  title: string;
  subtitle: string;
  protocols: SLRProtocol[];
  researchQuestions: SLRResearchQuestion[];
  metadata: SLRMetadata[];
}
