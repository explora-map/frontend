import React from 'react';
import logoDark from '../assets/images/logo-dark.png';
import logoLight from '../assets/images/logo-light.png';

export default function AppLogo({ className }) {
    return (
        <picture>
            <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
            <img src={logoLight} alt="Explora" className={className} />
        </picture>
    );
}
