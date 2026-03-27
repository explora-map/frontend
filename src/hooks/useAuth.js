// useAuth.js
// Convenience hook — avoids importing both useContext and AuthContext
// in every consumer component.

import { useContext } from 'react';
import { AuthContext } from '../store/AuthContext';

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return ctx;
}