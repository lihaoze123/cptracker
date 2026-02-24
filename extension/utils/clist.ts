import { storage } from 'wxt/utils/storage';
import { getRatingResourceRegex } from './platforms';
import type { OJPlatform } from './types';

const CLOST_API_BASE = 'https://clist.by:443/api/v4';

interface ClistProblem {
  rating?: number;
  url?: string;
  name?: string;
}

interface ClistResponse {
  objects: ClistProblem[];
}

export async function fetchRating(problemName: string, platform: OJPlatform, problemUrl?: string): Promise<string | undefined> {
  const apiKey = await storage.getItem<string>('local:clistApiKey');
  const username = await storage.getItem<string>('local:clistUsername');
  console.log('[CPTracker] fetchRating:', { problemName, platform, problemUrl, apiKey: !!apiKey, username: !!username });

  if (!apiKey || !username) {
    console.log('[CPTracker] Missing apiKey or username');
    return undefined;
  }

  const resourceRegex = getRatingResourceRegex(platform);
  if (!resourceRegex) {
    console.log('[CPTracker] No rating resource configured for platform:', platform);
    return undefined;
  }

  try {
    // 清理题目名称，去除前缀如 "A. "
    const cleanName = problemName.replace(/^[A-Z]\.\s*/, '');

    // 使用精确匹配查询
    const url = `${CLOST_API_BASE}/problem/?name=${encodeURIComponent(cleanName)}&resource__regex=${resourceRegex}`;

    console.log('[CPTracker] Fetching rating from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `ApiKey ${username}:${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('[CPTracker] clist API error:', response.status, await response.text());
      return undefined;
    }

    const data: ClistResponse = await response.json();
    console.log('[CPTracker] clist response:', data);

    if (data.objects && data.objects.length > 0) {
      return data.objects[0].rating?.toString();
    }

    console.log('[CPTracker] No rating found for:', problemName);
    return undefined;
  } catch (error) {
    console.error('[CPTracker] Failed to fetch rating:', error);
    return undefined;
  }
}
