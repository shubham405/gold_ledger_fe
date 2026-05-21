import type { InputHTMLAttributes, WheelEvent } from 'react';

export type NumericInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> & {
  /** Whole numbers only (no decimal point). */
  integer?: boolean;
};

/** Numeric entry without spinner arrows; mouse wheel does not change the value. */
export function NumericInput({ className = '', integer = false, onWheel, ...props }: NumericInputProps) {
  const classes = ['input', 'input--numeric', className].filter(Boolean).join(' ');

  function handleWheel(e: WheelEvent<HTMLInputElement>) {
    e.currentTarget.blur();
    onWheel?.(e);
  }

  return (
    <input
      {...props}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      className={classes}
      onWheel={handleWheel}
    />
  );
}
