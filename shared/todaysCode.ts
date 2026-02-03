// Today's Code - Anti-cheat mechanism for proof submissions
// Generates a deterministic daily code based on UTC date

const CODE_WORDS = [
  'MOSS', 'LEAF', 'TREE', 'WAVE', 'GAIA', 'BLOOM', 'SEED', 'RAIN',
  'WIND', 'FERN', 'PINE', 'OCEAN', 'CORAL', 'EARTH', 'GREEN', 'SOLAR',
  'LUNA', 'STAR', 'CLOUD', 'RIVER', 'FOREST', 'MEADOW', 'VALLEY', 'PEAK',
  'GLACIER', 'REEF', 'OASIS', 'PRAIRIE', 'DELTA', 'ARCTIC', 'TROPIC'
];

export function getTodaysCode(): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  // Use day of year + year as seed for consistency
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
  const diff = utcDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Deterministic word selection based on day
  const wordIndex = (dayOfYear + now.getUTCFullYear()) % CODE_WORDS.length;
  const word = CODE_WORDS[wordIndex];
  
  // Generate 2-digit number (10-99) deterministically
  const numberSeed = (dayOfYear * 7 + now.getUTCFullYear() * 3) % 90 + 10;
  
  return `${word}-${numberSeed}`;
}

export function getCodeValidUntil(): Date {
  const now = new Date();
  // Code expires at midnight UTC
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
