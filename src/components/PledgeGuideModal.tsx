import { Modal } from './Modal';

interface PledgeGuideModalProps {
  open: boolean;
  onClose: () => void;
  onCreatePledge?: () => void;
  inactive?: boolean;
}

const SAMPLE_COLLATERAL = [
  {
    type: 'Gold',
    description:
      '22K gold chain — 8.5 g, hallmarked, kept in sealed packet #A-12 with shop tag attached.',
    weight: '8.5 g',
    value: '₹68,000',
  },
  {
    type: 'Gold',
    description:
      'Pair of 22K bangles — combined 24 g, traditional design, minor surface wear on one bangle.',
    weight: '24 g',
    value: '₹1,92,000',
  },
  {
    type: 'Silver',
    description: '925 silver anklet set — 120 g, stored in cloth pouch with customer initials "RK".',
    weight: '120 g',
    value: '₹14,400',
  },
];

export function PledgeGuideModal({
  open,
  onClose,
  onCreatePledge,
  inactive,
}: PledgeGuideModalProps) {
  return (
    <Modal title="About pledges" open={open} onClose={onClose} wide>
      <article className="pledge-guide">
        <section className="pledge-guide__section">
          <h3>What is a pledge?</h3>
          <p>
            A pledge is a loan secured against ornaments or other valuables that a customer leaves with
            your shop. You record the loan amount, interest terms, due date, pledged items, and every
            payment — so principal, interest, and collateral stay clear from day one to closure.
          </p>
        </section>

        <section className="pledge-guide__section">
          <h3>How to create a pledge</h3>
          <ol className="pledge-guide__steps">
            <li>
              <strong>Register the customer</strong> — Go to Customers and add their name, mobile
              number, and address. You need a customer before you can create a pledge.
            </li>
            <li>
              <strong>Open New pledge</strong> — From Pledges (or the customer profile), click{' '}
              <strong>+ New pledge</strong>.
            </li>
            <li>
              <strong>Enter loan terms</strong> — Choose the customer, loan amount (₹), interest rate
              (whole or decimal, e.g. 2.5% per month), billing period (daily pro-rata or
              month-to-month), interest type (simple, compound, or custom schedule), start date, and
              due date.
            </li>
            <li>
              <strong>Add pledged items</strong> — After saving, open the pledge detail page and add
              each ornament or item with type, description, weight, quantity, and estimated value.
            </li>
            <li>
              <strong>Record payments</strong> — As the customer pays, record each payment. Interest
              and principal are split automatically. Confirm payments when the amount is final.
            </li>
            <li>
              <strong>Close when settled</strong> — When dues are cleared and ornaments are returned,
              close the pledge. It moves to Closed and stays in your history.
            </li>
          </ol>
        </section>

        <section className="pledge-guide__section">
          <h3>Features available</h3>
          <ul className="pledge-guide__features">
            <li>
              <strong>Pledge list &amp; filters</strong> — View all pledges; filter by Active, Overdue,
              or Closed.
            </li>
            <li>
              <strong>Interest options</strong> — Simple (SI), compound (CI), or phased schedule with
              different rates and methods per period. Rates can use decimals (e.g. 2.5% per month).
            </li>
            <li>
              <strong>Billing periods</strong> — Daily pro-rata (30-day month) or calendar month
              (same date each month).
            </li>
            <li>
              <strong>Collateral tracking</strong> — Gold, silver, electronics, vehicles, grains,
              products, and other item types with weight, quantity, and value.
            </li>
            <li>
              <strong>Live interest &amp; dues</strong> — Accrued interest, interest due, total payable,
              and a full breakdown by month or table view.
            </li>
            <li>
              <strong>Payment history</strong> — Draft and confirmed payments with principal/interest
              split, outstanding balance after each payment, and notes.
            </li>
            <li>
              <strong>Edit terms</strong> — Update rate, due date, or billing period with optional
              recalculation from pledge start.
            </li>
            <li>
              <strong>PDF exports</strong> — Download a single pledge PDF, payment ledger PDF, or
              export all pledges for your records.
            </li>
            <li>
              <strong>Dashboard overview</strong> — Active and overdue counts, outstanding principal,
              total collateral, and recent pledges at a glance.
            </li>
          </ul>
        </section>

        <section className="pledge-guide__section pledge-guide__sample">
          <h3>Sample pledge walkthrough</h3>
          <p className="pledge-guide__sample-intro">
            Below is an example of how a typical gold pledge might look in your ledger — with detailed
            item descriptions you would enter on the pledge detail page.
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

            <h4>Pledged items</h4>
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

            <h4>Example payment (after 2 months)</h4>
            <p className="pledge-guide__sample-note">
              Customer pays ₹8,000 on 15 Mar 2026 — ₹7,500 toward accrued interest (2.5% for two
              months) and ₹500 toward principal. Outstanding principal becomes ₹1,49,500; future
              interest is calculated on the reduced balance.
            </p>
          </div>
        </section>

        {onCreatePledge ? (
          <div className="pledge-guide__actions">
            <button type="button" className="btn btn--primary" onClick={onCreatePledge}>
              Create your first pledge
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        ) : inactive ? (
          <div className="pledge-guide__actions">
            <p className="pledge-guide__activation-note">
              Your account is pending activation. Once enabled, you can create pledges, add
              collateral, and record payments from this app.
            </p>
            <a href="mailto:support@myledger.in" className="btn btn--primary">
              Contact support to activate
            </a>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}
      </article>
    </Modal>
  );
}
