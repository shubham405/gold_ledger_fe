import { PLEDGE_GUIDE_PATH } from '../lib/pledgeGuide';

type PledgeGuideLinkProps = {
  className?: string;
  children?: React.ReactNode;
};

export function PledgeGuideLink({
  className = 'btn btn--primary',
  children = 'Learn more about pledges',
}: PledgeGuideLinkProps) {
  return (
    <a href={PLEDGE_GUIDE_PATH} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
