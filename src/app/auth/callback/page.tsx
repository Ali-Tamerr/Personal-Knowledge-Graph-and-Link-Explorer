'use client';

import { useEffect } from 'react';

export default function AuthCallbackPage() {
  useEffect(() => {
    // This page will be opened in the popup after OAuth success
    // Send message to parent window and close popup
    if (window.opener) {
      window.opener.postMessage(
        { type: 'NEXTAUTH_OAUTH_SUCCESS' },
        window.location.origin
      );
      window.close();
    } else {
      // Fallback: redirect to home if not in popup
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white">
      <div className="text-center">
        <h1 className="text-lg font-semibold mb-2">Authentication Successful!</h1>
        <p className="text-zinc-400">This window will close automatically...</p>
      </div>
    </div>
  );
}