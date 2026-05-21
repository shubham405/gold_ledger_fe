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

export function DateInput({
  value,
  onChange,
  max,
  min,
  required,
  className = 'input',
  id,
}: DateInputProps) {
  const inputValue = toDateInputValue(value);

  return (
    <div className="date-input">
      <input
        id={id}
        type="date"
        className={className}
        value={inputValue}
        max={max}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
      {inputValue ? (
        <span className="date-input__display">{formatDate(inputValue)}</span>
      ) : null}
    </div>
  );
}
