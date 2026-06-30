import { useEffect, useState } from 'react';
import logo from '../logo/Logo.png';
import './LogoLoader.css';

function LogoLoader({ label = 'טוען...', delay = 500 }) {
  const [isVisible, setIsVisible] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) {
      setIsVisible(true);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [delay]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="logo-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="logo-loader__mark" aria-hidden="true">
        <img className="logo-loader__image logo-loader__image--top-left" src={logo} alt="" />
        <img className="logo-loader__image logo-loader__image--top-right" src={logo} alt="" />
        <img className="logo-loader__image logo-loader__image--bottom-right" src={logo} alt="" />
        <img className="logo-loader__image logo-loader__image--bottom-left" src={logo} alt="" />
      </div>
      <span className="logo-loader__sr-only">{label}</span>
    </div>
  );
}

export default LogoLoader;
