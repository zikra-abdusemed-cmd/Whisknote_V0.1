import React, { useState } from 'react';
import { X, Scale, Thermometer, ArrowRightLeft, Sparkles, BookOpen } from 'lucide-react';
import {
  COMMON_BAKING_INGREDIENTS,
  parseFraction,
  formatFraction,
  convertFahrenheitToCelsius,
  convertCelsiusToFahrenheit,
} from '../utils/conversions';

interface UnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIngredient?: string;
}

export const UnitConverterModal: React.FC<UnitConverterModalProps> = ({
  isOpen,
  onClose,
  initialIngredient = '',
}) => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'temperatures' | 'cheatsheet'>('ingredients');

  // Ingredient-specific conversion state
  const [selectedIngredientName, setSelectedIngredientName] = useState<string>(
    initialIngredient || COMMON_BAKING_INGREDIENTS[0].name
  );
  const [amountInput, setAmountInput] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<'cups' | 'grams' | 'tablespoons' | 'ounces'>('cups');
  const [toUnit, setToUnit] = useState<'grams' | 'cups' | 'tablespoons' | 'ounces'>('grams');

  // Temperature state
  const [tempInput, setTempInput] = useState<string>('350');
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');

  if (!isOpen) return null;

  const selectedIngredient =
    COMMON_BAKING_INGREDIENTS.find(i => i.name.toLowerCase() === selectedIngredientName.toLowerCase()) ||
    COMMON_BAKING_INGREDIENTS[0];

  // Perform calculation
  const calcAmount = parseFraction(amountInput);
  let convertedResult = 0;

  if (calcAmount > 0) {
    // 1 cup = gramsPerCup
    const gramsPerCup = selectedIngredient.gramsPerCup;

    // Convert input into grams first as pivot
    let pivotGrams = 0;
    if (fromUnit === 'cups') pivotGrams = calcAmount * gramsPerCup;
    else if (fromUnit === 'grams') pivotGrams = calcAmount;
    else if (fromUnit === 'tablespoons') pivotGrams = (calcAmount / 16) * gramsPerCup;
    else if (fromUnit === 'ounces') pivotGrams = calcAmount * 28.3495;

    // Convert pivot grams into target unit
    if (toUnit === 'grams') convertedResult = Math.round(pivotGrams);
    else if (toUnit === 'cups') convertedResult = Math.round((pivotGrams / gramsPerCup) * 100) / 100;
    else if (toUnit === 'tablespoons') convertedResult = Math.round((pivotGrams / (gramsPerCup / 16)) * 10) / 10;
    else if (toUnit === 'ounces') convertedResult = Math.round((pivotGrams / 28.3495) * 10) / 10;
  }

  // Temperature calculations
  const tempVal = parseFloat(tempInput) || 0;
  const convertedTemp =
    tempUnit === 'F' ? convertFahrenheitToCelsius(tempVal) : convertCelsiusToFahrenheit(tempVal);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] border border-[#E9DFD7] rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-[#D9CFC7] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[#EFE8DF] flex items-center justify-between bg-[#FAF5EE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C26343]/15 text-[#C26343] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-base sm:text-lg font-bold text-[#2E2520]">Baking Measurement Converter</h3>
              <p className="text-[11px] sm:text-xs text-[#7A6A61]">Ingredient density & oven temperature conversions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85766E] hover:text-[#2E2520] hover:bg-[#EDE5DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-[#EFE8DF] px-4 sm:px-6 bg-[#FAF5EE]/60 text-xs font-semibold text-[#7A6A61] overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ingredients'
                ? 'border-[#C26343] text-[#C26343] font-bold'
                : 'border-transparent hover:text-[#2E2520]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Ingredient Density
          </button>
          <button
            onClick={() => setActiveTab('temperatures')}
            className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'temperatures'
                ? 'border-[#C26343] text-[#C26343] font-bold'
                : 'border-transparent hover:text-[#2E2520]'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" /> Oven Temperatures
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cheatsheet'
                ? 'border-[#C26343] text-[#C26343] font-bold'
                : 'border-transparent hover:text-[#2E2520]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Baker's Cheat Sheet
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'ingredients' && (
            <div className="space-y-5">
              {/* Select ingredient */}
              <div>
                <label className="block text-xs font-semibold text-[#66574F] uppercase tracking-wider mb-2">
                  Select Baking Ingredient
                </label>
                <select
                  value={selectedIngredientName}
                  onChange={e => setSelectedIngredientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-[#2E2520] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#C26343]/30"
                >
                  {COMMON_BAKING_INGREDIENTS.map(item => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.gramsPerCup}g per cup)
                    </option>
                  ))}
                </select>
                {selectedIngredient.notes && (
                  <p className="text-xs text-[#8C7A70] mt-1.5 italic">
                    Note: {selectedIngredient.notes}
                  </p>
                )}
              </div>

              {/* Amount & Units Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* From */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E9E0D6]">
                  <label className="block text-xs font-semibold text-[#7A6A61] mb-1.5">Convert From</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      placeholder="e.g. 1 1/2 or 250"
                      className="w-1/2 px-3 py-2 rounded-lg border border-[#D9CFC7] bg-white text-sm font-semibold text-[#2E2520]"
                    />
                    <select
                      value={fromUnit}
                      onChange={e => setFromUnit(e.target.value as typeof fromUnit)}
                      className="w-1/2 px-2.5 py-2 rounded-lg border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520]"
                    >
                      <option value="cups">cups</option>
                      <option value="grams">grams</option>
                      <option value="tablespoons">tablespoons</option>
                      <option value="ounces">ounces (oz)</option>
                    </select>
                  </div>
                </div>

                {/* To */}
                <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E9E0D6]">
                  <label className="block text-xs font-semibold text-[#7A6A61] mb-1.5">Target Unit</label>
                  <select
                    value={toUnit}
                    onChange={e => setToUnit(e.target.value as typeof toUnit)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC7] bg-white text-sm font-medium text-[#2E2520]"
                  >
                    <option value="grams">grams (g)</option>
                    <option value="cups">cups</option>
                    <option value="tablespoons">tablespoons (tbsp)</option>
                    <option value="ounces">ounces (oz)</option>
                  </select>
                </div>
              </div>

              {/* Result card */}
              <div className="p-5 rounded-2xl bg-[#F4EBE1] border border-[#DFD3C5] text-center">
                <span className="text-xs uppercase font-bold tracking-widest text-[#8A7568]">Calculated Measurement</span>
                <div className="mt-2 text-3xl font-extrabold text-[#9E492C]">
                  {toUnit === 'cups' ? formatFraction(convertedResult) : convertedResult} {toUnit}
                </div>
                <p className="text-xs text-[#705E53] mt-2">
                  {amountInput} {fromUnit} of {selectedIngredient.name} ={' '}
                  <span className="font-semibold text-[#2E2520]">
                    {toUnit === 'cups' ? formatFraction(convertedResult) : convertedResult} {toUnit}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Baker's Golden Rule:</strong> Measuring by weight (grams) with a digital kitchen scale produces consistent, bakery-quality texture every single time!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'temperatures' && (
            <div className="space-y-5">
              <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#E9E0D6] space-y-4">
                <label className="block text-xs font-semibold text-[#66574F] uppercase tracking-wider">
                  Oven Temperature Input
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={tempInput}
                    onChange={e => setTempInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-lg font-bold text-[#2E2520]"
                  />
                  <div className="flex rounded-xl overflow-hidden border border-[#D9CFC7]">
                    <button
                      onClick={() => setTempUnit('F')}
                      className={`px-4 py-2 text-sm font-bold ${
                        tempUnit === 'F' ? 'bg-[#C26343] text-white' : 'bg-white text-[#66574F]'
                      }`}
                    >
                      °F
                    </button>
                    <button
                      onClick={() => setTempUnit('C')}
                      className={`px-4 py-2 text-sm font-bold ${
                        tempUnit === 'C' ? 'bg-[#C26343] text-white' : 'bg-white text-[#66574F]'
                      }`}
                    >
                      °C
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversion Display */}
              <div className="p-5 rounded-2xl bg-[#F4EBE1] border border-[#DFD3C5] text-center">
                <span className="text-xs uppercase font-bold tracking-widest text-[#8A7568]">Equivalent Temperature</span>
                <div className="mt-2 text-3xl font-extrabold text-[#9E492C]">
                  {tempUnit === 'F' ? `${(convertedTemp as { c: number }).c}°C` : `${convertedTemp as number}°F`}
                </div>
                {tempUnit === 'F' && (convertedTemp as { gasMark?: string }).gasMark && (
                  <p className="text-xs font-semibold text-[#705E53] mt-2">
                    UK Gas Mark: {(convertedTemp as { gasMark?: string }).gasMark}
                  </p>
                )}
              </div>

              {/* Standard baking marks */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#66574F] uppercase tracking-wider">Common Baking Temperatures</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setTempInput('325');
                      setTempUnit('F');
                    }}
                    className="p-2.5 rounded-xl bg-white border border-[#E5DDD4] hover:border-[#C26343] text-left transition-colors"
                  >
                    <div className="font-bold text-[#2E2520]">325°F / 160°C</div>
                    <div className="text-[11px] text-[#8C7A70]">Cakes & Cheesecakes</div>
                  </button>
                  <button
                    onClick={() => {
                      setTempInput('350');
                      setTempUnit('F');
                    }}
                    className="p-2.5 rounded-xl bg-white border border-[#E5DDD4] hover:border-[#C26343] text-left transition-colors"
                  >
                    <div className="font-bold text-[#2E2520]">350°F / 175°C</div>
                    <div className="text-[11px] text-[#8C7A70]">Cookies & Quick Breads</div>
                  </button>
                  <button
                    onClick={() => {
                      setTempInput('375');
                      setTempUnit('F');
                    }}
                    className="p-2.5 rounded-xl bg-white border border-[#E5DDD4] hover:border-[#C26343] text-left transition-colors"
                  >
                    <div className="font-bold text-[#2E2520]">375°F / 190°C</div>
                    <div className="text-[11px] text-[#8C7A70]">Pastries & Pies</div>
                  </button>
                  <button
                    onClick={() => {
                      setTempInput('450');
                      setTempUnit('F');
                    }}
                    className="p-2.5 rounded-xl bg-white border border-[#E5DDD4] hover:border-[#C26343] text-left transition-colors"
                  >
                    <div className="font-bold text-[#2E2520]">450°F / 230°C</div>
                    <div className="text-[11px] text-[#8C7A70]">Artisan Sourdough</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cheatsheet' && (
            <div className="space-y-4">
              <div className="border border-[#E7DFD7] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF5EE] border-b border-[#E7DFD7] text-[#66574F] font-bold">
                    <tr>
                      <th className="p-3">Ingredient</th>
                      <th className="p-3">1 Cup</th>
                      <th className="p-3">1 Tbsp</th>
                      <th className="p-3">1 Tsp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8DF] text-[#332A24]">
                    {COMMON_BAKING_INGREDIENTS.slice(0, 10).map(item => (
                      <tr key={item.name} className="hover:bg-[#FAF8F5]">
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3">{item.gramsPerCup}g</td>
                        <td className="p-3">{Math.round((item.gramsPerCup / 16) * 10) / 10}g</td>
                        <td className="p-3">{Math.round((item.gramsPerCup / 48) * 10) / 10}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EFE8DF] bg-[#FAF5EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold transition-colors"
          >
            Close Converter
          </button>
        </div>
      </div>
    </div>
  );
};
