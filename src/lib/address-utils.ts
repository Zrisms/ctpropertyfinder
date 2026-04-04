// Address normalization utilities
const ABBREVIATIONS: Record<string, string> = {
  street: 'ST', road: 'RD', drive: 'DR', avenue: 'AVE', lane: 'LN',
  court: 'CT', circle: 'CIR', boulevard: 'BLVD', place: 'PL',
  terrace: 'TER', way: 'WAY', trail: 'TRL', highway: 'HWY',
  parkway: 'PKWY', turnpike: 'TPKE', extension: 'EXT',
};

export function normalizeAddress(address: string): string {
  let normalized = address.trim();
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    const re = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(re, abbr);
  }
  return normalized;
}
