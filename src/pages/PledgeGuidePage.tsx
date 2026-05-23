import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { PledgeGuideContent } from '../components/PledgeGuideContent';

export function PledgeGuidePage() {
  const { canWrite } = useAuth();

  return (
    <div className="page pledge-guide-page">
      <PageHeader
        title="About pledges"
        subtitle="Everything you need to manage jewelry pledges in MyLedger"
        backTo="/loans"
        backLabel="Pledges"
      />
      <PledgeGuideContent inactive={!canWrite} />
    </div>
  );
}
