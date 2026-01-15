/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { availableAssets, availableChains, LOGO_URLS } from "@/lib/utils";

interface SelectionPanelProps {
  type: "token" | "chain";
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function SelectionPanel({
  type,
  onSelect,
  onClose,
}: SelectionPanelProps) {
  const items = type === "token" ? availableAssets : availableChains;
  const title = type === "token" ? "Select Token" : "Select Chain";

  return (
    <div className="w-72 shrink-0">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl sticky top-4 h-[600px] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white h-auto p-2"
          >
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <img
                  src={LOGO_URLS[item]}
                  alt={item}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-white font-medium">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
