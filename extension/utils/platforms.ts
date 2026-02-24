import { atcoderAdapter } from './atcoder';
import { codeforcesAdapter } from './codeforces';
import type { OJAdapter, OJPlatform, ProblemInfo } from './types';

const adapters: OJAdapter[] = [codeforcesAdapter, atcoderAdapter];

function getAdapterByUrl(url: string): OJAdapter | undefined {
  return adapters.find((adapter) => adapter.detect(url));
}

function getAdapterById(platform: OJPlatform): OJAdapter | undefined {
  return adapters.find((adapter) => adapter.id === platform);
}

export function detectPlatform(url: string): OJPlatform {
  return getAdapterByUrl(url)?.id || 'unknown';
}

export async function extractProblemInfo(url: string): Promise<ProblemInfo | null> {
  const adapter = getAdapterByUrl(url);
  if (!adapter) return null;
  return await adapter.extractInfo();
}

export function resolveSubmissionUrl(info: ProblemInfo, contextUrl?: string): string {
  const baseUrl = contextUrl || info.url;

  if (info.submissionUrl) {
    try {
      return new URL(info.submissionUrl, baseUrl).toString();
    } catch {
      if (info.submissionUrl.startsWith('http')) {
        return info.submissionUrl;
      }
    }
  }

  const adapter = getAdapterByUrl(baseUrl) || getAdapterByUrl(info.url);
  if (!adapter) return '';
  return adapter.resolveSubmissionUrl(info);
}

export function getRatingResourceRegex(platform: OJPlatform): string | undefined {
  return getAdapterById(platform)?.ratingResourceRegex;
}

