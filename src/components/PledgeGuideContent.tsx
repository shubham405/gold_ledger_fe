import { Link } from 'react-router-dom';
import { SAMPLE_COLLATERAL } from '../lib/pledgeGuide';

interface PledgeGuideContentProps {
  inactive?: boolean;
}

export function PledgeGuideContent({ inactive }: PledgeGuideContentProps) {
  return (
    <article className="pledge-guide">
      <section className="pledge-guide__section pledge-guide__intro card">
        <h2>What is a pledge?</h2>
        <p>
          A pledge is a loan secured against ornaments or other valuables that a customer leaves with
          your shop. You record the loan amount, interest terms, due date, pledged items, and every
          payment — so principal, interest, and collateral stay clear from day one to closure.
        </p>
      </section>

      <section className="pledge-guide__section card">
        <h2>How to create a pledge</h2>
        <ol className="pledge-guide__steps">
          <li>
            <strong>Register the customer</strong> — Add name, mobile, and address under Customers.
          </li>
          <li>
            <strong>Open New pledge</strong> — From Pledges or the customer profile, click{' '}
            <strong>+ New pledge</strong>.
          </li>
          <li>
            <strong>Enter loan terms</strong> — Customer, amount (₹), rate (e.g. 2.5% p.m.),
            billing period, interest type, start date, and due date.
          </li>
          <li>
            <strong>Add pledged items</strong> — On the pledge detail page, add each item with type,
            description, weight, quantity, and value.
          </li>
          <li>
            <strong>Record payments</strong> — Log each payment; interest and principal split
            automatically. Confirm when final.
          </li>
          <li>
            <strong>Close when settled</strong> — Close after dues are cleared and ornaments are
            returned.
          </li>
        </ol>
      </section>

      <section className="pledge-guide__section card">
        <h2>Features available</h2>
        <ul className="pledge-guide__features">
          <li>
            <strong>Pledge list &amp; filters</strong> — Active, Overdue, or Closed.
          </li>
          <li>
            <strong>Interest options</strong> — SI, CI, or phased schedule; decimals like 2.5%.
          </li>
          <li>
            <strong>Billing periods</strong> — Daily pro-rata or calendar month.
          </li>
          <li>
            <strong>Collateral tracking</strong> — Gold, silver, electronics, and more.
          </li>
          <li>
            <strong>Live interest &amp; dues</strong> — Accrued interest, payable, breakdown views.
          </li>
          <li>
            <strong>Payment history</strong> — Draft/confirmed payments with splits and notes.
          </li>
          <li>
            <strong>Edit terms</strong> — Update rate, due date, or billing period.
          </li>
          <li>
            <strong>PDF exports</strong> — Pledge PDF, payment ledger, or full export.
          </li>
          <li>
            <strong>Dashboard overview</strong> — Counts, outstanding principal, collateral.
          </li>
        </ul>
      </section>

      <section className="pledge-guide__section pledge-guide__sample card">
        <h2>Sample pledge</h2>
        <p className="pledge-guide__sample-intro">
          Example of a typical gold pledge with detailed item descriptions.
        </p>

        <div className="pledge-guide__sample-card">
          <header className="pledge-guide__sample-header">
            <div>
              <p className="pledge-guide__sample-label">Customer</p>
              <p className="pledge-guide__sample-value">Ramesh Kumar · 98765 43210</p>
            </div>
            <span className="badge badge--active">Active</span>
          </header>

          <dl className="pledge-guide__sample-grid">
            <div>
              <dt>Loan amount</dt>
              <dd>₹1,50,000</dd>
            </div>
            <div>
              <dt>Interest rate</dt>
              <dd>2.5% per month (simple)</dd>
            </div>
            <div>
              <dt>Billing period</dt>
              <dd>Daily — pro-rata (30-day month)</dd>
            </div>
            <div>
              <dt>Start date</dt>
              <dd>15 Jan 2026</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>15 Jul 2026</dd>
            </div>
            <div>
              <dt>Total collateral value</dt>
              <dd>₹2,74,400</dd>
            </div>
          </dl>

          <h3>Pledged items</h3>
          <div className="pledge-guide__sample-table-wrap">
            <table className="pledge-guide__sample-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_COLLATERAL.map((item) => (
                  <tr key={item.description}>
                    <td>{item.type}</td>
                    <td>{item.description}</td>
                    <td>{item.weight}</td>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Example payment (after 2 months)</h3>
          <p className="pledge-guide__sample-note">
            Customer pays ₹8,000 on 15 Mar 2026 — ₹7,500 toward accrued interest (2.5% for two
            months) and ₹500 toward principal. Outstanding principal becomes ₹1,49,500.
          </p>
        </div>
      </section>

      <footer className="pledge-guide__actions card">
        {inactive ? (
          <>
            <p className="pledge-guide__activation-note">
              Your account is pending activation. Once enabled, you can create pledges, add
              collateral, and record payments.
            </p>
            <a href="mailto:support@myledger.in" className="btn btn--primary">
              Contact support to activate
            </a>
          </>
        ) : (
          <Link to="/loans" className="btn btn--primary">
            Go to pledges
          </Link>
        )}
      </footer>
    </article>
  );
}
