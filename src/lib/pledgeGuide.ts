export const PLEDGE_GUIDE_PATH = '/loans/guide';

export const SAMPLE_COLLATERAL = [
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
] as const;

export function openPledgeGuideInNewTab(): void {
  window.open(PLEDGE_GUIDE_PATH, '_blank', 'noopener,noreferrer');
}
