export function Loading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
