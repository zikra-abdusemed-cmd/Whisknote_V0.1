import React, { useState } from 'react';
import { Scale, Thermometer, Box, Droplets, Timer, Sparkles, ArrowRight } from 'lucide-react';
import { COMMON_BAKING_INGREDIENTS, parseFraction, convertFahrenheitToCelsius, convertCelsiusToFahrenheit } from '../utils/conversions';

interface KitchenToolsTabProps {
  onOpenTimer: (seconds: number, label: string) => void;
}

export const KitchenToolsTab: React.FC<KitchenToolsTabProps> = ({ onOpenTimer }) => {
  const [activeTool, setActiveTool] = useState<'converter' | 'temp' | 'pans' | 'hydration'>('converter');

  // Converter state
  const [ingredientName, setIngredientName] = useState<string>(COMMON_BAKING_INGREDIENTS[0].name);
  const [cupsAmount, setCupsAmount] = useState<string>('1');
  const [converterDirection, setConverterDirection] = useState<'cups-to-grams' | 'grams-to-cups'>('cups-to-grams');

  // Temp state
  const [tempVal, setTempVal] = useState<string>('350');
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');

  // Pan converter state
  const [fromPan, setFromPan] = useState<number>(8); // 8 inch round
  const [toPan, setToPan] = useState<number>(9); // 9 inch round

  // Hydration state
  const [flourGrams, setFlourGrams] = useState<number>(500);
  const [waterGrams, setWaterGrams] = useState<number>(375);

  const selectedIngredient =
    COMMON_BAKING_INGREDIENTS.find(i => i.name === ingredientName) || COMMON_BAKING_INGREDIENTS[0];

  // Calculate ingredient conversion
  const parsedAmount = parseFraction(cupsAmount);
  let convertedAmountText = '';
  if (converterDirection === 'cups-to-grams') {
    const grams = Math.round(parsedAmount * selectedIngredient.gramsPerCup);
    convertedAmountText = `${grams} g`;
  } else {
    const cups = Math.round((parsedAmount / selectedIngredient.gramsPerCup) * 100) / 100;
    convertedAmountText = `${cups} cups`;
  }

  // Pan scaling ratio (Area of circle: pi * r^2)
  const areaFrom = Math.PI * Math.pow(fromPan / 2, 2);
  const areaTo = Math.PI * Math.pow(toPan / 2, 2);
  const panMultiplier = Math.round((areaTo / areaFrom) * 100) / 100;

  // Hydration percentage
  const hydration = flourGrams > 0 ? Math.round((waterGrams / flourGrams) * 100) : 0;

  return (
    <div className="p-4 space-y-5 pb-24 text-[#2E2520]">
      {/* Tab Header */}
      <div className="space-y-1">
        <h2 className="font-serif-display text-2xl font-bold text-[#2E2520]">
          Baker's Mobile Toolkit
        </h2>
        <p className="text-xs text-[#7A6A61]">
          Essential calculations, precision scales, and pan ratios for the home kitchen.
        </p>
      </div>

      {/* Tool Selector Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTool('converter')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTool === 'converter'
              ? 'bg-[#C26343] text-white shadow-xs'
              : 'bg-white border border-[#D9CFC7] text-[#6E5C53]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" /> Cups to Grams
        </button>
        <button
          onClick={() => setActiveTool('temp')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTool === 'temp'
              ? 'bg-[#C26343] text-white shadow-xs'
              : 'bg-white border border-[#D9CFC7] text-[#6E5C53]'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" /> Oven Temp
        </button>
        <button
          onClick={() => setActiveTool('pans')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTool === 'pans'
              ? 'bg-[#C26343] text-white shadow-xs'
              : 'bg-white border border-[#D9CFC7] text-[#6E5C53]'
          }`}
        >
          <Box className="w-3.5 h-3.5" /> Pan Scaler
        </button>
        <button
          onClick={() => setActiveTool('hydration')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTool === 'hydration'
              ? 'bg-[#C26343] text-white shadow-xs'
              : 'bg-white border border-[#D9CFC7] text-[#6E5C53]'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" /> Hydration %
        </button>
        <button
          onClick={() => onOpenTimer(600, 'Bake Timer')}
          className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all bg-white border border-[#D9CFC7] text-[#6E5C53] hover:border-[#C26343] hover:text-[#C26343]"
          title="Open Baking Timer"
        >
          <Timer className="w-3.5 h-3.5 text-[#C26343]" /> Oven Timer
        </button>
      </div>

      {/* Active Tool Card */}
      <div className="bg-[#FFFDF9] border border-[#E8DFD8] rounded-3xl p-5 shadow-sm space-y-4">
        {activeTool === 'converter' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C26343] uppercase tracking-wider">
                Ingredient Weight Converter
              </span>
              <button
                onClick={() =>
                  setConverterDirection(prev =>
                    prev === 'cups-to-grams' ? 'grams-to-cups' : 'cups-to-grams'
                  )
                }
                className="text-[11px] font-bold text-[#6E5C53] bg-[#FAF5EE] hover:bg-[#F2EAE0] px-2.5 py-1 rounded-lg border border-[#E8DFD8] transition-colors"
              >
                Switch to {converterDirection === 'cups-to-grams' ? 'Grams → Cups' : 'Cups → Grams'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">
                Select Baking Ingredient
              </label>
              <select
                value={ingredientName}
                onChange={e => setIngredientName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30"
              >
                {COMMON_BAKING_INGREDIENTS.map(ing => (
                  <option key={ing.name} value={ing.name}>
                    {ing.name} ({ing.gramsPerCup}g / cup)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">
                Amount ({converterDirection === 'cups-to-grams' ? 'Cups or fraction' : 'Grams'})
              </label>
              <input
                type="text"
                value={cupsAmount}
                onChange={e => setCupsAmount(e.target.value)}
                placeholder={converterDirection === 'cups-to-grams' ? 'e.g. 1 1/2 or 0.75' : 'e.g. 240'}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30"
              />
            </div>

            {/* Calculated Result Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF3EA] to-[#FFF9F3] border border-[#EADBCC] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#8C7A70]">Calculated Weight:</p>
                <p className="font-serif-display text-2xl font-extrabold text-[#C26343]">
                  {convertedAmountText}
                </p>
              </div>
              <span className="text-[11px] text-[#8C7A70] italic">
                1 cup = {selectedIngredient.gramsPerCup}g
              </span>
            </div>
          </div>
        )}

        {activeTool === 'temp' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#C26343] uppercase tracking-wider block">
              Oven Temperature Conversion
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Oven Temp</label>
                <input
                  type="number"
                  value={tempVal}
                  onChange={e => setTempVal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Scale</label>
                <div className="flex border border-[#D9CFC7] rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setTempUnit('F')}
                    className={`flex-1 py-2.5 text-xs font-bold ${
                      tempUnit === 'F' ? 'bg-[#C26343] text-white' : 'text-[#6E5C53]'
                    }`}
                  >
                    °F Fahrenheit
                  </button>
                  <button
                    onClick={() => setTempUnit('C')}
                    className={`flex-1 py-2.5 text-xs font-bold ${
                      tempUnit === 'C' ? 'bg-[#C26343] text-white' : 'text-[#6E5C53]'
                    }`}
                  >
                    °C Celsius
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E8DFD8] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#7A6A61] font-medium">Converted Oven Setting:</p>
                <p className="font-serif-display text-2xl font-bold text-[#2E2520]">
                  {tempUnit === 'F'
                    ? `${convertFahrenheitToCelsius(Number(tempVal) || 350).c}°C (Gas Mark ${convertFahrenheitToCelsius(Number(tempVal) || 350).gasMark})`
                    : `${convertCelsiusToFahrenheit(Number(tempVal) || 180)}°F`}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'pans' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#C26343] uppercase tracking-wider block">
              Round Pan Size Multiplier
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Original Pan (inches)</label>
                <select
                  value={fromPan}
                  onChange={e => setFromPan(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold"
                >
                  <option value={6}>6" Round</option>
                  <option value={8}>8" Round</option>
                  <option value={9}>9" Round</option>
                  <option value={10}>10" Round</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Target Pan (inches)</label>
                <select
                  value={toPan}
                  onChange={e => setToPan(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold"
                >
                  <option value={6}>6" Round</option>
                  <option value={8}>8" Round</option>
                  <option value={9}>9" Round</option>
                  <option value={10}>10" Round</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E8DFD8]">
              <p className="text-[11px] text-[#7A6A61] font-medium">Recipe Ingredient Multiplier:</p>
              <p className="font-serif-display text-2xl font-bold text-[#C26343]">
                {panMultiplier}x
              </p>
              <p className="text-[11px] text-[#7A6A61] mt-1">
                Multiply all recipe ingredients by <strong>{panMultiplier}</strong> to fill your {toPan}" pan to the exact same depth as an {fromPan}" pan.
              </p>
            </div>
          </div>
        )}

        {activeTool === 'hydration' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#C26343] uppercase tracking-wider block">
              Baker's Bread Hydration %
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Total Flour (g)</label>
                <input
                  type="number"
                  value={flourGrams}
                  onChange={e => setFlourGrams(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E5C53] mb-1.5">Total Water (g)</label>
                <input
                  type="number"
                  value={waterGrams}
                  onChange={e => setWaterGrams(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E8DFD8]">
              <p className="text-[11px] text-[#7A6A61] font-medium">Calculated Dough Hydration:</p>
              <p className="font-serif-display text-2xl font-bold text-[#2E2520]">
                {hydration}%
              </p>
              <p className="text-[11px] text-[#7A6A61] mt-1">
                {hydration < 65
                  ? 'Lower hydration: Stiffer dough, great for sandwich loaves and bagels.'
                  : hydration <= 75
                  ? 'Classic artisanal sourdough hydration: open crumb, workable dough.'
                  : 'High hydration: Open, airy ciabatta and rustic French baguettes.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Timer Launcher */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFFDF9] to-[#FAF5EE] border border-[#E8DFD8] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#C26343] text-white shadow-xs">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-[#2E2520]">Need an Oven Timer?</p>
            <p className="text-[11px] text-[#7A6A61]">Start a 15-min or 30-min kitchen chime</p>
          </div>
        </div>
        <button
          onClick={() => onOpenTimer(15 * 60, '15-Min Bake Timer')}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#D9CFC7] hover:bg-[#FAF5EE] text-xs font-bold text-[#C26343] shadow-2xs"
        >
          Start Timer
        </button>
      </div>
    </div>
  );
};
