import iconSvg from '../assets/images/logo.svg';

export default function AppLogo({ className = '' }) {
  return (
    <div className={`app-logo ${className}`}>
      <img src={iconSvg} alt="" aria-hidden="true" />
      <span aria-hidden="true">Explora</span>
    </div>
  );
}
