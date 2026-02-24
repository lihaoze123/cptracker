export interface ProblemInfo {
  url: string;
  name: string;
  rating?: string;
  tags: string[];
  solvedTime?: number;
  code?: string;
  submissionUrl?: string;
  language?: string;
}

export interface ExtensionSettings {
  clistApiKey: string;
  clistUsername: string;
  cptrackerUrl: string;
}

export type OJPlatform = string;

export interface OJAdapter {
  id: OJPlatform;
  detect: (url: string) => boolean;
  extractInfo: () => ProblemInfo | Promise<ProblemInfo | null> | null;
  resolveSubmissionUrl: (info: ProblemInfo) => string;
  ratingResourceRegex?: string;
  // Navigation helpers
  isSubmissionPage: (url: string) => boolean;
  isSameProblemPage: (currentUrl: string, problemUrl: string) => boolean;
  getNextPageUrl: (currentInfo: ProblemInfo, pendingData: ImportPayload | null) => string | null;
  getReturnUrl: (currentInfo: ProblemInfo) => string | null;
}

export interface ImportPayload {
  url: string;
  name: string;
  rating: string;
  tags: string;
  solvedTime?: number;
  code?: string;
  language?: string;
}
