import { NumericInput } from './NumericInput';
import { SelectInput } from './SelectInput';
import { useInterestRateBasis } from '../context/InterestRateBasisContext';
import { rateFieldLabel } from '../lib/interestRate';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

export function InterestRateField({ value, onChange, required, className }: Props) {
  const { basis, setBasis } = useInterestRateBasis();

  return (
    <label className={className}>
      {rateFieldLabel(basis)}
      <div className="interest-rate-field">
        <NumericInput
          required={required}
          value={value}
          placeholder="e.g. 2.5"
          onChange={(e) => onChange(e.target.value)}
        />
        <SelectInput
          value={basis}
          onChange={(v) => setBasis(v as 'MONTHLY' | 'YEARLY')}
          options={[
            { value: 'MONTHLY', label: 'Monthly' },
            { value: 'YEARLY', label: 'Yearly' },
          ]}
        />
      </div>
      <span className="form-hint">Up to 4 decimal places. Saved as monthly rate on the server.</span>
    </label>
  );
}
