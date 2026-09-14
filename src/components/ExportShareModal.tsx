import React, { useState } from 'react';
import { X, Printer, Copy, Check, Share2, Download, Sparkles } from 'lucide-react';
import { Recipe } from '../types';

interface ExportShareModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({ recipe, isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Format shareable plain text
  const shareableText = `🧁 ${recipe.title} (WhiskNote)
${recipe.description}

Category: ${recipe.category} | Difficulty: ${recipe.difficulty}
Prep Time: ${recipe.prepTimeMinutes}m | Bake Time: ${recipe.bakeTimeMinutes}m | Oven: ${recipe.ovenTemperatureF || 350}°F
Yield: ${recipe.servingsLabel || `${recipe.servings} servings`}

INGREDIENTS:
${recipe.ingredients.map(i => `• ${i.amount} ${i.unit} ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}

INSTRUCTIONS:
${recipe.instructions.map(s => `${s.stepNumber}. ${s.instruction}`).join('\n\n')}

${recipe.bakersNotes ? `BAKER'S NOTES:\n${recipe.bakersNotes}\n\n` : ''}Baked with love via WhiskNote 🍰`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipe, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipe.title.toLowerCase().replace(/\s+/g, '-')}-whisknote.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs no-print">
      <div className="bg-[#FFFDF9] border border-[#E8DFD8] rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-[#D9CFC7] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#EFE8DF] flex items-center justify-between bg-[#FAF5EE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C26343]/15 text-[#C26343] shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-base sm:text-lg font-bold text-[#2E2520]">Export & Share Recipe</h3>
              <p className="text-[11px] sm:text-xs text-[#7A6A61] truncate max-w-xs">{recipe.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85766E] hover:text-[#2E2520] hover:bg-[#EDE5DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#E5DDD4] bg-white hover:bg-[#FAF6F0] hover:border-[#C26343] transition-all group"
            >
              <div className="p-2.5 rounded-full bg-[#FAF5EE] text-[#C26343] mb-2 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#2E2520]">Print Recipe Card</span>
              <span className="text-xs text-[#8C7A70] text-center mt-0.5">Kitchen-friendly printable PDF</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#E5DDD4] bg-white hover:bg-[#FAF6F0] hover:border-[#C26343] transition-all group"
            >
              <div className="p-2.5 rounded-full bg-[#FAF5EE] text-[#C26343] mb-2 group-hover:scale-110 transition-transform">
                {copied ? <Check className="w-5 h-5 text-[#588157]" /> : <Copy className="w-5 h-5" />}
              </div>
              <span className="text-sm font-bold text-[#2E2520]">{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
              <span className="text-xs text-[#8C7A70] text-center mt-0.5">Ready for WhatsApp or Email</span>
            </button>
          </div>

          {/* Text preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#66574F] uppercase tracking-wider">
                Shareable Recipe Preview
              </label>
              <button
                onClick={handleCopyText}
                className="text-xs text-[#C26343] font-bold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#FAF5EE] border border-[#EAE1D7] text-xs text-[#443831] font-mono whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed selection:bg-[#E9D5C8]">
              {shareableText}
            </pre>
          </div>

          {/* JSON Backup option */}
          <div className="pt-2 border-t border-[#EFE8DF] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#2E2520]">Baker's File Export</p>
              <p className="text-[11px] text-[#8C7A70]">Save this recipe as a portable WhiskNote JSON file</p>
            </div>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-semibold text-[#66574F] hover:bg-[#F2ECE4] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EFE8DF] bg-[#FAF5EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
