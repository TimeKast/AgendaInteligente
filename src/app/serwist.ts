'use client';

/**
 * Serwist Service Worker Registration Provider
 *
 * Re-exports the SerwistProvider as a client component so it can be
 * used in the server-side root layout. This component registers
 * the service worker (`/sw.js`) in the browser.
 *
 * @see https://serwist.pages.dev/docs/next/config
 */
export { SerwistProvider } from '@serwist/turbopack/react';
