export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'OVERDUE';

export type InterestMethod = 'SIMPLE' | 'COMPOUND';
export type InterestAccrualBasis = 'DAILY_30' | 'CALENDAR_MONTH';
export type InterestPlanType = 'FLAT' | 'SCHEDULED';

export type ItemType =
  | 'GOLD'
  | 'SILVER'
  | 'ELECTRONICS'
  | 'VEHICLE'
  | 'GRAINS'
  | 'PRODUCTS'
  | 'OTHER';

export type WeightUnit = 'GRAM' | 'KG' | 'TOLA' | 'OUNCE';

export interface Borrower {
  id: number;
  name: string;
  fathersName: string;
  address: string;
  mobileNumber: string;
  aadhaarNumber?: string;   // masked (XXXX-XXXX-9012) or null
  panNumber?: string;       // masked (AB****234F) or null
  loanCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowerIdentity {
  borrowerId: number;
  aadhaarNumber?: string;   // full decrypted value
  panNumber?: string;       // full decrypted value
}

export interface BorrowerRequest {
  name: string;
  fathersName: string;
  address: string;
  mobileNumber: string;
  aadhaarNumber?: string;
  panNumber?: string;
}

export interface Loan {
  id: number;
  borrower: Borrower;
  principalAmount: number;
  outstandingPrincipal: number;
  monthlyInterestRatePercent: number;
  interestAccrualBasis?: InterestAccrualBasis;
  startDate: string;
  dueDate: string;
  status: LoanStatus;
  closedAt?: string;
  collateralItems?: CollateralItem[];
  totalCollateralValue?: number;
  interestSummary?: InterestSummary;
}

export interface InterestPeriodRequest {
  fromMonth: number;
  toMonth?: number | null;
  monthlyRatePercent: number;
  interestMethod: InterestMethod;
}

export interface LoanRequest {
  borrowerId: number;
  principalAmount: number;
  monthlyInterestRatePercent: number;
  startDate: string;
  dueDate: string;
  defaultInterestMethod?: InterestMethod;
  interestAccrualBasis?: InterestAccrualBasis;
  interestPeriods?: InterestPeriodRequest[];
}

export interface LoanUpdateRequest {
  monthlyInterestRatePercent?: number;
  defaultInterestMethod?: InterestMethod;
  interestAccrualBasis?: InterestAccrualBasis;
  dueDate?: string;
  /**
   * When provided, rate/method changes apply forward-only from this date.
   * Omit (or set to null) to replace the full schedule from the start.
   */
  effectiveFromDate?: string | null;
  interestPeriods?: InterestPeriodRequest[];
}

export interface InterestPeriodDto {
  periodOrder: number;
  fromMonth: number;
  toMonth?: number | null;
  monthlyRatePercent: number;
  interestMethod: InterestMethod;
}

export interface InterestCalculationLine {
  lineIndex: number;
  monthIndex: number;
  /** 1-based index of the principal-reduction segment this line belongs to */
  segmentIndex?: number;
  fromDate: string;
  toDate: string;
  daysInPeriod: number;
  periodLabel: string;
  method: InterestMethod;
  ratePercent: number;
  principalBase: number;
  interestAmount: number;
  runningAccrued: number;
  formulaDescription: string;
}

export interface InterestSummary {
  loanId: number;
  originalPrincipal: number;
  outstandingPrincipal: number;
  monthlyRatePercent: number;
  accrualFromDate?: string;
  daysElapsed: number;
  monthsElapsed: number;
  accruedInterest: number;
  /** Portion of accruedInterest from Simple Interest periods */
  siAccruedInterest?: number;
  /** Portion of accruedInterest from Compound Interest periods */
  ciAccruedInterest?: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  interestDue: number;
  totalPayable: number;
  asOfDate: string;
  interestPlanType?: InterestPlanType;
  accrualBasis?: InterestAccrualBasis;
  defaultMethod?: InterestMethod;
  /** Number of distinct principal-reduction segments in the full history */
  principalSegmentCount?: number;
  schedule?: InterestPeriodDto[];
  lines?: InterestCalculationLine[];
}

export interface CollateralItem {
  id: number;
  loanId: number;
  itemType: ItemType;
  quantity?: number;
  weight?: number;
  weightUnit?: WeightUnit;
  description: string;
  estimatedValue: number;
}

export interface CollateralRequest {
  itemType: ItemType;
  quantity?: number;
  weight?: number;
  weightUnit?: WeightUnit;
  description: string;
  estimatedValue: number;
}

export interface Payment {
  id: number;
  loanId: number;
  paymentDate: string;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  outstandingPrincipalAfter: number;
  notes?: string;
  confirmed: boolean;
  confirmedAt?: string;
  createdAt?: string;
}

export interface PaymentRequest {
  paymentDate?: string;
  principalPaid: number;
  interestPaid: number;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  message?: string;
  /** Bean validation errors from the API (field name → message). */
  fieldErrors?: Record<string, string>;
  /** @deprecated use fieldErrors */
  errors?: Record<string, string>;
}
