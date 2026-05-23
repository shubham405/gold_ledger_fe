import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  getStoredInterestRateBasis,
  setStoredInterestRateBasis,
  type InterestRateBasis,
} from '../lib/interestRate';

type ContextValue = {
  basis: InterestRateBasis;
  setBasis: (basis: InterestRateBasis) => void;
};

const InterestRateBasisContext = createContext<ContextValue | null>(null);

export function InterestRateBasisProvider({ children }: { children: ReactNode }) {
  const [basis, setBasisState] = useState<InterestRateBasis>(() => getStoredInterestRateBasis());

  const value = useMemo<ContextValue>(
    () => ({
      basis,
      setBasis: (next) => {
        setStoredInterestRateBasis(next);
        setBasisState(next);
      },
    }),
    [basis],
  );

  return (
    <InterestRateBasisContext.Provider value={value}>{children}</InterestRateBasisContext.Provider>
  );
}

export function useInterestRateBasis(): ContextValue {
  const ctx = useContext(InterestRateBasisContext);
  if (!ctx) {
    throw new Error('useInterestRateBasis must be used within InterestRateBasisProvider');
  }
  return ctx;
}
