import React from 'react';
import { Layout, Grid, List, FileImage } from 'lucide-react';

type ViewModeProps = {
  currentMode: string;
  onModeChange: (mode: string) => void;
};

export function ViewModeSelector({ currentMode, onModeChange }: ViewModeProps) {
  const modes = [
    { id: 'list', name: 'List', icon: List },
    { id: 'grid', name: 'Grid', icon: Grid },
    { id: 'story', name: 'Story', icon: FileImage },
  ];

  return (
    <div className="bg-base-100 rounded-lg shadow-sm p-2 mb-4 border">
      <div className="flex flex-wrap justify-center gap-1">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'text-base-content/70 hover:bg-base-200'
              }`}
              aria-pressed={isActive}
            >
              <Icon size={16} />
              <span className="text-sm">{mode.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}