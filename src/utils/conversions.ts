export interface BakingIngredientDensity {
  name: string;
  category: 'Flour' | 'Sugar' | 'Fats & Dairy' | 'Leaveners & Salts' | 'Other';
  gramsPerCup: number;
  gramsPerTbsp?: number;
  gramsPerTsp?: number;
  notes?: string;
}

export const COMMON_BAKING_INGREDIENTS: BakingIngredientDensity[] = [
  { name: 'All-Purpose Flour', category: 'Flour', gramsPerCup: 120, notes: 'Spoon and leveled' },
  { name: 'Bread Flour', category: 'Flour', gramsPerCup: 127, notes: 'High protein structure' },
  { name: 'Cake Flour', category: 'Flour', gramsPerCup: 114, notes: 'Silky low protein' },
  { name: 'Whole Wheat Flour', category: 'Flour', gramsPerCup: 130, notes: 'Denser whole grain' },
  { name: 'Almond Flour', category: 'Flour', gramsPerCup: 96, notes: 'Finely blanched' },
  { name: 'Granulated White Sugar', category: 'Sugar', gramsPerCup: 200 },
  { name: 'Brown Sugar (Packed)', category: 'Sugar', gramsPerCup: 220, notes: 'Firmly pressed into cup' },
  { name: 'Powdered (Confectioners) Sugar', category: 'Sugar', gramsPerCup: 120, notes: 'Sifted' },
  { name: 'Unsalted Butter', category: 'Fats & Dairy', gramsPerCup: 227, gramsPerTbsp: 14.2, notes: '1 stick = 1/2 cup = 113.5g' },
  { name: 'Heavy Cream', category: 'Fats & Dairy', gramsPerCup: 238 },
  { name: 'Whole Milk', category: 'Fats & Dairy', gramsPerCup: 245 },
  { name: 'Vegetable / Canola Oil', category: 'Fats & Dairy', gramsPerCup: 218 },
  { name: 'Greek Yogurt / Sour Cream', category: 'Fats & Dairy', gramsPerCup: 240 },
  { name: 'Cocoa Powder (Dutch or Natural)', category: 'Other', gramsPerCup: 100 },
  { name: 'Rolled Oats', category: 'Other', gramsPerCup: 90 },
  { name: 'Honey / Maple Syrup', category: 'Other', gramsPerCup: 340 },
  { name: 'Semi-Sweet Chocolate Chips', category: 'Other', gramsPerCup: 175 },
  { name: 'Instant / Active Dry Yeast', category: 'Leaveners & Salts', gramsPerCup: 144, gramsPerTsp: 3.1, notes: '1 packet = 7g (2 1/4 tsp)' },
  { name: 'Baking Powder', category: 'Leaveners & Salts', gramsPerCup: 230, gramsPerTsp: 4.8 },
  { name: 'Baking Soda', category: 'Leaveners & Salts', gramsPerCup: 288, gramsPerTsp: 6.0 },
  { name: 'Fine Sea Salt', category: 'Leaveners & Salts', gramsPerCup: 275, gramsPerTsp: 5.7 },
  { name: 'Maldon Flaky Salt', category: 'Leaveners & Salts', gramsPerCup: 145, gramsPerTsp: 3.0 },
];

/**
 * Converts a fractional or decimal string into a floating number.
 * e.g., "1 1/2" -> 1.5, "3/4" -> 0.75, "250" -> 250
 */
export function parseFraction(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  const str = input.trim();
  
  if (str.includes(' ')) {
    const parts = str.split(' ');
    const whole = parseFloat(parts[0]) || 0;
    const fraction = parseFraction(parts[1]);
    return whole + fraction;
  }
  
  if (str.includes('/')) {
    const [num, den] = str.split('/').map(s => parseFloat(s));
    if (den && !isNaN(num) && !isNaN(den)) {
      return num / den;
    }
  }
  
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

/**
 * Converts decimal number into nice baker-friendly fraction string
 * e.g. 1.5 -> "1 1/2", 0.75 -> "3/4", 0.333 -> "1/3"
 */
export function formatFraction(val: number): string {
  if (val <= 0) return '0';
  const tolerance = 0.05;
  const whole = Math.floor(val);
  const remainder = val - whole;

  const fractions: Array<[number, string]> = [
    [0, ''],
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.5, '1/2'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
    [1, ''],
  ];

  let bestMatch = '';
  let minDiff = 1;

  for (const [fracVal, label] of fractions) {
    const diff = Math.abs(remainder - fracVal);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = label;
      if (fracVal === 1) {
        return (whole + 1).toString();
      }
    }
  }

  if (minDiff <= tolerance && bestMatch !== '') {
    return whole > 0 ? `${whole} ${bestMatch}` : bestMatch;
  }

  // If whole number
  if (remainder < 0.01) return whole.toString();

  // Otherwise clean 1 decimal place
  return (Math.round(val * 10) / 10).toString();
}

/**
 * Convert Oven Fahrenheit to Celsius and gas mark equivalent
 */
export function convertFahrenheitToCelsius(f: number): { c: number; gasMark?: string } {
  const c = Math.round((f - 32) * (5 / 9));
  let gasMark: string | undefined;

  if (f >= 275 && f < 300) gasMark = '1';
  else if (f >= 300 && f < 325) gasMark = '2';
  else if (f >= 325 && f < 350) gasMark = '3';
  else if (f >= 350 && f < 375) gasMark = '4';
  else if (f >= 375 && f < 400) gasMark = '5';
  else if (f >= 400 && f < 425) gasMark = '6';
  else if (f >= 425 && f < 450) gasMark = '7';
  else if (f >= 450 && f < 475) gasMark = '8';
  else if (f >= 475) gasMark = '9';

  return { c, gasMark };
}

export function convertCelsiusToFahrenheit(c: number): number {
  return Math.round(c * (9 / 5) + 32);
}

/**
 * Calculates ingredient scaling based on base servings and target servings
 */
export function scaleIngredientAmount(originalAmountStr: string, originalServings: number, targetServings: number): string {
  if (!originalAmountStr || originalServings <= 0 || targetServings <= 0) {
    return originalAmountStr;
  }
  const originalVal = parseFraction(originalAmountStr);
  if (originalVal === 0) return originalAmountStr;

  const ratio = targetServings / originalServings;
  const scaledVal = originalVal * ratio;
  return formatFraction(scaledVal);
}
