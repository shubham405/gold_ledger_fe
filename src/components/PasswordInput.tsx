import { useState } from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input password-field__input${className ? ` ${className}` : ''}`}
      />
      <button
        type="button"
        className="password-field__toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 1l14 14M6.5 6.6A2.5 2.5 0 0010.4 10.5M4 4.1C2.4 5.2 1 6.8 1 8c0 0 2.5 5 7 5a7.8 7.8 0 004.5-1.5M7 3.1A7.5 7.5 0 0115 8c-.4.9-1 1.8-1.6 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
