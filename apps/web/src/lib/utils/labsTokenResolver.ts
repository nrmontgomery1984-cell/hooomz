/**
 * Labs Token Resolver
 * Parses {{LAB:token-id}} syntax in text and resolves to token data
 */

import type { LabsToken } from '@hooomz/shared-contracts';

const LABS_TOKEN_REGEX = /\{\{LAB:([a-z0-9_-]+)\}\}/g;

export interface TokenMatch {
  raw: string;
  tokenId: string;
  startIndex: number;
  endIndex: number;
}

export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'token'; token: LabsToken; raw: string }
  | { type: 'missing_token'; tokenId: string; raw: string };

/** Find all {{LAB:xxx}} tokens in text */
export function findTokensInText(text: string): TokenMatch[] {
  const matches: TokenMatch[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(LABS_TOKEN_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      raw: match[0],
      tokenId: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return matches;
}

/** Resolve all {{LAB:xxx}} tokens in text to segments for rendering */
export function resolveLabsTokens(
  text: string,
  tokenMap: Map<string, LabsToken>
): TextSegment[] {
  const segments: TextSegment[] = [];
  const matches = findTokensInText(text);

  if (matches.length === 0) {
    return [{ type: 'text', content: text }];
  }

  let lastIndex = 0;

  for (const match of matches) {
    // Add preceding text
    if (match.startIndex > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.startIndex) });
    }

    const token = tokenMap.get(match.tokenId);
    if (token) {
      segments.push({ type: 'token', token, raw: match.raw });
    } else {
      segments.push({ type: 'missing_token', tokenId: match.tokenId, raw: match.raw });
    }

    lastIndex = match.endIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

/** Check if text contains any {{LAB:xxx}} tokens */
export function hasLabsTokens(text: string): boolean {
  return new RegExp(LABS_TOKEN_REGEX.source).test(text);
}

/** Extract unique token IDs from text */
export function extractTokenIds(text: string): string[] {
  const matches = findTokensInText(text);
  return [...new Set(matches.map((m) => m.tokenId))];
}
