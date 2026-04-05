// Address normalization utilities — expands common typos & abbreviations
// so the autocomplete API receives a cleaner query.

const ABBREVIATIONS: Record<string, string> = {
  // Standard
  street: 'ST', road: 'RD', drive: 'DR', avenue: 'AVE', lane: 'LN',
  court: 'CT', circle: 'CIR', boulevard: 'BLVD', place: 'PL',
  terrace: 'TER', way: 'WAY', trail: 'TRL', highway: 'HWY',
  parkway: 'PKWY', turnpike: 'TPKE', extension: 'EXT',
};

// Map common mistypes / shorthand → canonical suffix for Nominatim
const TYPO_MAP: Record<string, string> = {
  // Street
  st: 'Street', str: 'Street', srt: 'Street', strt: 'Street', steet: 'Street', sreet: 'Street', stret: 'Street',
  // Road
  rd: 'Road', raod: 'Road', rosd: 'Road', rod: 'Road',
  // Drive
  dr: 'Drive', drv: 'Drive', drve: 'Drive', dirve: 'Drive', drie: 'Drive',
  // Avenue
  ave: 'Avenue', av: 'Avenue', avn: 'Avenue', avnue: 'Avenue', aveneu: 'Avenue', avenu: 'Avenue',
  // Lane
  ln: 'Lane', lne: 'Lane', lnae: 'Lane',
  // Court
  ct: 'Court', crt: 'Court', cort: 'Court', curt: 'Court', cout: 'Court',
  // Circle
  cir: 'Circle', crcl: 'Circle', circ: 'Circle', circl: 'Circle', cicle: 'Circle',
  // Boulevard
  blvd: 'Boulevard', blv: 'Boulevard', bvld: 'Boulevard', boulvard: 'Boulevard', boulevrd: 'Boulevard',
  // Place
  pl: 'Place', plc: 'Place', plce: 'Place',
  // Terrace
  ter: 'Terrace', trce: 'Terrace', terr: 'Terrace', terrce: 'Terrace', terace: 'Terrace',
  // Way
  wy: 'Way', wya: 'Way',
  // Trail
  trl: 'Trail', tral: 'Trail', tril: 'Trail', trali: 'Trail',
  // Highway
  hwy: 'Highway', hgwy: 'Highway', hiway: 'Highway', hghway: 'Highway',
  // Parkway
  pkwy: 'Parkway', pkw: 'Parkway', prk: 'Parkway', pk: 'Parkway', prkwy: 'Parkway', prkway: 'Parkway', parkwy: 'Parkway',
  // Turnpike
  tpke: 'Turnpike', tpk: 'Turnpike', tnpk: 'Turnpike', turnpk: 'Turnpike',
  // Extension
  ext: 'Extension', extn: 'Extension', extsn: 'Extension',
  // Ridge / Run / Path / Crossing etc.
  rdg: 'Ridge', rdge: 'Ridge',
  xing: 'Crossing', xng: 'Crossing', crssing: 'Crossing',
  pth: 'Path',
};

/**
 * Normalize an address query for better geocoding results.
 * Expands abbreviations & common typos so Nominatim gets a clean query.
 */
export function normalizeAddress(address: string): string {
  let normalized = address.trim();

  // Expand typos / shorthand at word boundaries (last word or any word)
  for (const [typo, canonical] of Object.entries(TYPO_MAP)) {
    const re = new RegExp(`\\b${typo}\\b`, 'gi');
    normalized = normalized.replace(re, canonical);
  }

  return normalized;
}
