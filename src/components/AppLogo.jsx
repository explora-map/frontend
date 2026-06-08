export default function AppLogo({ className = '' }) {
  return (
    <div className={`app-logo ${className}`}>
      <img src="/logo.svg" alt="" aria-hidden="true" />
      <span aria-hidden="true">Explora</span>
    </div>
  );
}
