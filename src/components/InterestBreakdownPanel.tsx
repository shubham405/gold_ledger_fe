import type { InterestCalculationLine, InterestSummary } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export type BreakdownView = 'summary' | 'table';

interface InterestBreakdownPanelProps {
  interest: InterestSummary;
  view: BreakdownView;
}

export function InterestBreakdownPanel({ interest, view }: InterestBreakdownPanelProps) {
  if (view === 'table') {
    return <TableView interest={interest} />;
  }
  return <SummaryBreakdown interest={interest} />;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function groupBySegment(lines: InterestCalculationLine[]) {
  const map = new Map<number, InterestCalculationLine[]>();
  for (const line of lines) {
    const seg = line.segmentIndex ?? 1;
    if (!map.has(seg)) map.set(seg, []);
    map.get(seg)!.push(line);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a - b);
}

function segmentPrincipal(lines: InterestCalculationLine[]) {
  return lines[0]?.principalBase ?? 0;
}

function segmentDateRange(lines: InterestCalculationLine[]) {
  const first = lines[0];
  const last = lines[lines.length - 1];
  return { from: first?.fromDate, to: last?.toDate };
}

function segmentTotalInterest(lines: InterestCalculationLine[]) {
  return lines.reduce((s, l) => s + l.interestAmount, 0);
}

/* ─── summary view ─────────────────────────────────────────────────────── */

function SummaryBreakdown({ interest }: { interest: InterestSummary }) {
  const planLabel =
    interest.interestPlanType === 'SCHEDULED' ? 'Phased schedule' : 'Flat rate';
  const methodLabel =
    interest.defaultMethod === 'COMPOUND' ? 'Compound (CI)' : 'Simple (SI)';

  const hasSplit =
    interest.siAccruedInterest !== undefined &&
    interest.ciAccruedInterest !== undefined &&
    (interest.siAccruedInterest > 0 || interest.ciAccruedInterest > 0);

  const segments =
    interest.lines && interest.lines.length > 0
      ? groupBySegment(interest.lines)
      : null;

  const multiSegment = segments && segments.length > 1;

  return (
    <div className="interest-breakdown">
      {/* ── meta overview ── */}
      <div className="interest-breakdown__overview">
        <div className="interest-breakdown__stat">
          <span className="interest-breakdown__stat-label">Plan</span>
          <span className="interest-breakdown__stat-value">{planLabel}</span>
        </div>
        <div className="interest-breakdown__stat">
          <span className="interest-breakdown__stat-label">Default method</span>
          <span className="interest-breakdown__stat-value">{methodLabel}</span>
        </div>
        <div className="interest-breakdown__stat">
          <span className="interest-breakdown__stat-label">As of</span>
          <span className="interest-breakdown__stat-value">{formatDate(interest.asOfDate)}</span>
        </div>
        <div className="interest-breakdown__stat">
          <span className="interest-breakdown__stat-label">Days elapsed</span>
          <span className="interest-breakdown__stat-value">{interest.daysElapsed}</span>
        </div>
        {multiSegment && (
          <div className="interest-breakdown__stat">
            <span className="interest-breakdown__stat-label">Principal reductions</span>
            <span className="interest-breakdown__stat-value">{segments!.length - 1}</span>
          </div>
        )}
      </div>

      {/* ── SI / CI split ── */}
      {hasSplit && (
        <div className="interest-breakdown__block">
          <h3 className="interest-breakdown__heading">Interest by method</h3>
          <div className="method-split">
            <div className="method-split__item method-split__item--si">
              <span className="method-split__badge">SI</span>
              <span className="method-split__label">Simple interest</span>
              <strong className="method-split__value">
                {formatCurrency(interest.siAccruedInterest)}
              </strong>
            </div>
            <div className="method-split__item method-split__item--ci">
              <span className="method-split__badge method-split__badge--ci">CI</span>
              <span className="method-split__label">Compound interest</span>
              <strong className="method-split__value">
                {formatCurrency(interest.ciAccruedInterest)}
              </strong>
            </div>
            <div className="method-split__item method-split__item--total">
              <span className="method-split__label">Total accrued</span>
              <strong className="method-split__value">
                {formatCurrency(interest.accruedInterest)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ── rate schedule ── */}
      {interest.schedule && interest.schedule.length > 0 && (
        <div className="interest-breakdown__block">
          <h3 className="interest-breakdown__heading">Rate schedule</h3>
          <div className="interest-breakdown__schedule">
            {interest.schedule.map((p) => (
              <div key={p.periodOrder} className="interest-breakdown__schedule-item">
                <span className="interest-breakdown__schedule-range">
                  Month {p.fromMonth}
                  {p.toMonth ? `–${p.toMonth}` : '+'}
                </span>
                <span className="interest-breakdown__schedule-rate">{p.monthlyRatePercent}%</span>
                <span className="interest-breakdown__schedule-method">
                  {p.interestMethod === 'SIMPLE' ? 'SI' : 'CI'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── calculation lines, grouped by principal segment ── */}
      <div className="interest-breakdown__block">
        <h3 className="interest-breakdown__heading">
          Day-based calculation
          <span className="interest-breakdown__heading-hint">
            {multiSegment
              ? `${segments!.length} segments (principal changed ${segments!.length - 1}×)`
              : 'original principal throughout'}
          </span>
        </h3>
        <dl className="interest-breakdown__context">
          <div>
            <dt>Original principal</dt>
            <dd>{formatCurrency(interest.originalPrincipal)}</dd>
          </div>
          <div>
            <dt>Outstanding principal</dt>
            <dd>{formatCurrency(interest.outstandingPrincipal)}</dd>
          </div>
        </dl>

        {segments ? (
          <div className="interest-breakdown__segments">
            {segments.map(([segIdx, segLines]) => {
              const principal = segmentPrincipal(segLines);
              const { from, to } = segmentDateRange(segLines);
              const segTotal = segmentTotalInterest(segLines);
              return (
                <div key={segIdx} className="interest-segment">
                  <div className="interest-segment__header">
                    <span className="interest-segment__label">
                      Segment {segIdx}
                    </span>
                    <span className="interest-segment__meta">
                      {from && to ? `${formatDate(from)} – ${formatDate(to)}` : ''}
                    </span>
                    <span className="interest-segment__principal">
                      Principal: {formatCurrency(principal)}
                    </span>
                    <span className="interest-segment__total">
                      Interest: {formatCurrency(segTotal)}
                    </span>
                  </div>
                  <div className="interest-breakdown__steps">
                    {segLines.map((line) => (
                      <div key={line.lineIndex} className="interest-breakdown__step">
                        <div className="interest-breakdown__step-header">
                          <span className="interest-breakdown__step-month">
                            {formatDate(line.fromDate)} – {formatDate(line.toDate)}
                          </span>
                          <span className="interest-breakdown__step-meta">
                            {line.daysInPeriod} days · {line.periodLabel} ·{' '}
                            <span
                              className={`method-badge ${
                                line.method === 'SIMPLE'
                                  ? 'method-badge--si'
                                  : 'method-badge--ci'
                              }`}
                            >
                              {line.method === 'SIMPLE' ? 'SI' : 'CI'}
                            </span>{' '}
                            · {line.ratePercent}%
                          </span>
                        </div>
                        <p className="interest-breakdown__step-formula">{line.formulaDescription}</p>
                        <div className="interest-breakdown__step-footer">
                          <span>Interest: {formatCurrency(line.interestAmount)}</span>
                          <span className="interest-breakdown__step-running">
                            Running accrued: {formatCurrency(line.runningAccrued)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty">No interest accrued for the selected period.</p>
        )}
      </div>

      {/* ── totals ── */}
      <div className="interest-breakdown__totals">
        <div className="interest-breakdown__total-row">
          <span>Total accrued interest</span>
          <strong>{formatCurrency(interest.accruedInterest)}</strong>
        </div>
        {hasSplit && interest.siAccruedInterest! > 0 && (
          <div className="interest-breakdown__total-row interest-breakdown__total-row--sub">
            <span>
              <span className="method-badge method-badge--si">SI</span> Simple portion
            </span>
            <span>{formatCurrency(interest.siAccruedInterest)}</span>
          </div>
        )}
        {hasSplit && interest.ciAccruedInterest! > 0 && (
          <div className="interest-breakdown__total-row interest-breakdown__total-row--sub">
            <span>
              <span className="method-badge method-badge--ci">CI</span> Compound portion
            </span>
            <span>{formatCurrency(interest.ciAccruedInterest)}</span>
          </div>
        )}
        <div className="interest-breakdown__total-row">
          <span>Interest already paid</span>
          <span>− {formatCurrency(interest.totalInterestPaid)}</span>
        </div>
        <div className="interest-breakdown__total-row interest-breakdown__total-row--due">
          <span>Interest due</span>
          <strong>{formatCurrency(interest.interestDue)}</strong>
        </div>
        <div className="interest-breakdown__total-row interest-breakdown__total-row--payable">
          <span>Total payable</span>
          <strong>{formatCurrency(interest.totalPayable)}</strong>
        </div>
        <p className="interest-breakdown__formula-hint">
          Total payable = outstanding ({formatCurrency(interest.outstandingPrincipal)}) + interest
          due ({formatCurrency(interest.interestDue)})
        </p>
      </div>
    </div>
  );
}

/* ─── table view ────────────────────────────────────────────────────────── */

function TableView({ interest }: { interest: InterestSummary }) {
  if (!interest.lines?.length) {
    return <p className="empty">No interest breakdown for this period.</p>;
  }

  const multiSegment = (interest.principalSegmentCount ?? 1) > 1;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {multiSegment && <th>Seg.</th>}
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Period</th>
            <th>Method</th>
            <th>Rate</th>
            <th>Base principal</th>
            <th>Interest</th>
            <th>Running total</th>
            <th>Formula</th>
          </tr>
        </thead>
        <tbody>
          {interest.lines.map((line) => (
            <tr key={line.lineIndex}>
              {multiSegment && <td>{line.segmentIndex}</td>}
              <td>{formatDate(line.fromDate)}</td>
              <td>{formatDate(line.toDate)}</td>
              <td>{line.daysInPeriod}</td>
              <td>{line.periodLabel}</td>
              <td>
                <span
                  className={`method-badge ${
                    line.method === 'SIMPLE' ? 'method-badge--si' : 'method-badge--ci'
                  }`}
                >
                  {line.method === 'SIMPLE' ? 'SI' : 'CI'}
                </span>
              </td>
              <td>{line.ratePercent}%</td>
              <td>{formatCurrency(line.principalBase)}</td>
              <td>{formatCurrency(line.interestAmount)}</td>
              <td>{formatCurrency(line.runningAccrued)}</td>
              <td>{line.formulaDescription}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
