import React from 'react';
import { Coffee, Bug, Gamepad2, Hammer } from 'lucide-react';

interface ActionPanelProps {
  onAction: (action: string) => void;
  disabled: boolean;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ onAction, disabled }) => {
  const actions = [
    { id: 'feed', label: 'Push Commit', icon: <Coffee size={20} />, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { id: 'clean', label: 'Refactor Code', icon: <Hammer size={20} />, color: 'bg-indigo-600 hover:bg-indigo-500' },
    { id: 'play', label: 'Team Building', icon: <Gamepad2 size={20} />, color: 'bg-rose-600 hover:bg-rose-500' },
    { id: 'fix', label: 'Close Issue', icon: <Bug size={20} />, color: 'bg-amber-600 hover:bg-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={disabled}
          className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none shadow-lg`}
        >
          {action.icon}
          <span className="font-semibold text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActionPanel;
