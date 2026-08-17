'use client';

import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked = false, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'} ${className || ''}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}
