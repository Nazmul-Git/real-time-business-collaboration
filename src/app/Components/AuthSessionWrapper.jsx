'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthSessionWrapper({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}