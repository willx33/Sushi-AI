import React, { useEffect, useState } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Aperture, ChevronDown } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  cost: string;
  context: string;
  icon: React.ReactNode;
}

const modelOptions: ModelOption[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT‑4o‑mini",
    cost: "$0.15 / $0.60 per 1M tokens",
    context: "~16K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "GPT‑3.5 Turbo (16K)",
    cost: "$1.00 / $2.00 per 1M tokens",
    context: "16K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT‑3.5 Turbo",
    cost: "$1.50 / $2.00 per 1M tokens",
    context: "4K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-4",
    name: "GPT‑4 (8K)",
    cost: "$30 / $60 per 1M tokens",
    context: "8K tokens",
    icon: <Aperture className="h-5 w-5" />,
  },
  {
    id: "gpt-4o",
    name: "GPT‑4o (Full)",
    cost: "$40 / $80 per 1M tokens",
    context: "8K tokens (assumed)",
    icon: <Aperture className="h-5 w-5" />,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (value: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
}) => {
  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  const [open, setOpen] = useState(false);

  const currentModel =
    modelOptions.find((model) => model.id === selectedModel) ||
    modelOptions[0];

  const handleSelect = (value: string) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <div className="p-4 border-b">
      <h2 className="font-bold mb-2">Select Model</h2>
      {open ? (
        <RadioGroup value={selectedModel} onValueChange={handleSelect}>
          {modelOptions.map((model) => (
            <RadioGroup.Item
              key={model.id}
              value={model.id}
              className="flex items-center space-x-2 p-2 border rounded transition-colors cursor-pointer"
              title={`${model.name} – ${model.cost} • Context: ${model.context}`}
            >
              {model.icon}
              <div>
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-muted-foreground">
                  {model.cost} • {model.context}
                </div>
              </div>
            </RadioGroup.Item>
          ))}
        </RadioGroup>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-between w-full p-2 border rounded transition-colors"
        >
          <div className="flex items-center space-x-2">
            {currentModel.icon}
            <div>
              <div className="font-medium">{currentModel.name}</div>
              <div className="text-xs text-muted-foreground">
                {currentModel.cost} • {currentModel.context}
              </div>
            </div>
          </div>
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ModelSelector;
