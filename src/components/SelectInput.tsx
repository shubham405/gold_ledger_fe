import { useEffect, useId, useRef, useState } from 'react';

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type SelectInputProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
};

export function SelectInput<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  searchPlaceholder = 'Search…',
  required,
  disabled,
  className = '',
  id: idProp,
  'aria-label': ariaLabel,
}: SelectInputProps<T>) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find((o) => o.value === value);

  const filtered = searchable && search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    if (searchable) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, searchable]);

  function pick(next: T) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`select-custom${open ? ' select-custom--open' : ''}${disabled ? ' select-custom--disabled' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        id={id}
        className="select-custom__trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={selected ? 'select-custom__value' : 'select-custom__placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <span className="select-custom__chevron" aria-hidden />
      </button>

      {required && !value && (
        <input
          tabIndex={-1}
          className="select-custom__validator"
          required
          value=""
          onChange={() => {}}
          aria-hidden
        />
      )}

      {open && (
        <div className="select-custom__menu" role="listbox" aria-labelledby={id}>
          {searchable && (
            <div className="select-custom__search-wrap">
              <input
                ref={searchRef}
                type="search"
                className="select-custom__search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <ul className="select-custom__list">
            {filtered.length === 0 ? (
              <li className="select-custom__empty">No results</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt.value === value}
                    className={`select-custom__option${opt.value === value ? ' select-custom__option--active' : ''}`}
                    onClick={() => pick(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
