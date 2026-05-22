import { useRef } from 'react';
import { formatDate, toDateInputValue } from '../utils/format';

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  required?: boolean;
  className?: string;
  id?: string;
};

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  } catch {
    /* showPicker may throw if not triggered by user gesture in some browsers */
    input.focus();
  }
}

export function DateInput({
  value,
  onChange,
  max,
  min,
  required,
  className = 'input',
  id,
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValue = toDateInputValue(value);

  return (
    <div className="date-input">
      <div className="date-input__field">
        <input
          ref={inputRef}
          id={id}
          type="date"
          className={`${className} date-input__control`}
          value={inputValue}
          max={max}
          min={min}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => openDatePicker(inputRef.current)}
          onFocus={() => openDatePicker(inputRef.current)}
        />
        <button
          type="button"
          className="date-input__trigger"
          tabIndex={-1}
          aria-label="Open calendar"
          onClick={() => openDatePicker(inputRef.current)}
        >
          <span className="date-input__icon" aria-hidden />
        </button>
      </div>
      {inputValue ? (
        <span className="date-input__display">{formatDate(inputValue)}</span>
      ) : null}
    </div>
  );
}
