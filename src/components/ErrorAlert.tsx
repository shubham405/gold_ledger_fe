import { createPortal } from 'react-dom';

type ErrorAlertPlacement = 'toast' | 'inline';

const TOAST_ROOT_ID = 'toast-root';

function getToastRoot(): HTMLElement {
  let root = document.getElementById(TOAST_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = TOAST_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

export function ErrorAlert({
  message,
  onDismiss,
  placement = 'toast',
}: {
  message: string;
  onDismiss?: () => void;
  placement?: ErrorAlertPlacement;
}) {
  const alert = (
    <div
      className={`alert alert--error${placement === 'inline' ? ' alert--inline' : ' alert--toast'}`}
      role="alert"
    >
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="btn-icon" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );

  if (placement === 'toast') {
    return createPortal(
      <div className="alert-toast-layer" role="presentation">
        {alert}
      </div>,
      getToastRoot()
    );
  }

  return alert;
}
