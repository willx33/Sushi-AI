// fe/src/components/ModelSelector.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Cpu, Aperture, Zap, Activity, Monitor } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  cost: string;
  context: string;
  icon: React.ReactNode;
}

const models: ModelOption[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT‑3.5 Turbo",
    cost: "$1.50 / $2.00 per 1M tokens",
    context: "4K tokens",
    icon: <Cpu className="h-5 w-5" />,
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "GPT‑3.5 Turbo (16K)",
    cost: "$1.00 / $2.00 per 1M tokens",
    context: "16K tokens",
    icon: <Cpu className="h-5 w-5" />,
  },
  {
    id: "gpt-4",
    name: "GPT‑4 (8K)",
    cost: "$30 / $60 per 1M tokens",
    context: "8K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-4-32k",
    name: "GPT‑4 (32K)",
    cost: "$60 / $120 per 1M tokens",
    context: "32K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT‑4 Turbo (128K)",
    cost: "$10 / $30 per 1M tokens",
    context: "128K tokens",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT‑4o‑mini",
    cost: "$0.15 / $0.60 per 1M tokens",
    context: "~16K tokens (est.)",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: "gpt-4o-full",
    name: "GPT‑4o (Full)",
    cost: "$40 / $80 per 1M tokens",
    context: "8K tokens (assumed)",
    icon: <Monitor className="h-5 w-5" />,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onChange }) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="mb-2 font-semibold text-sm">Select Model</div>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              onChange(model.id);
              localStorage.setItem("selectedModel", model.id);
            }}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 border text-sm transition-colors",
              selectedModel === model.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-gray-300 hover:bg-gray-100"
            )}
            // Using the title attribute to show cost and context info
            title={`${model.name} – ${model.cost} – Context: ${model.context}`}
          >
            {model.icon}
            <span>{model.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
