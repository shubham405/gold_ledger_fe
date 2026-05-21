import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveRegisterDraft } from '../lib/registerDraft';

export function RegisterShop() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    saveRegisterDraft({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim() || undefined,
    });
    navigate('/register/account');
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-step-header">
        <span className="auth-step-badge">Step 1 of 2</span>
        <h2>Your shop</h2>
        <p className="auth-subtitle">Tell us about your jewelry business</p>
      </div>

      <form className="form auth-form auth-form--compact" onSubmit={handleContinue}>
        <label>
          Shop name
          <input
            className="input"
            required
            placeholder="e.g. Shree Krishna Jewelers"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </label>
        <label>
          Owner name
          <input
            className="input"
            required
            placeholder="Your full name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </label>
        <label>
          Phone <span className="label-optional">(optional)</span>
          <input
            className="input"
            type="tel"
            maxLength={10}
            pattern="[0-9]{10}"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--block">
          Continue
        </button>
      </form>
    </div>
  );
}
