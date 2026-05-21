import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  backTo,
  backLabel = 'Back',
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {backTo && (
          <Link to={backTo} className="back-link">
            ← {backLabel}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}
