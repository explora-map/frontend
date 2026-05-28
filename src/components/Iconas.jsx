import React from 'react';

export const BookmarkIcon = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         width={size} height={size}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

export const BookmarkFilledIcon = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" stroke="currentColor"
         fill="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         width={size} height={size}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

export const EyeIcon = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         width={size} height={size}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
