export const runtime = "nodejs";

import { NextResponse } from "next/server";

/**
 * Serves the Firebase Messaging service worker at /firebase-messaging-sw.js
 * (via next.config.ts rewrite). Injects NEXT_PUBLIC_* config at request time
 * so no values need to be hardcoded in /public.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const content = `
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// Activate immediately — don't wait for existing tabs to close.
// Required so the registration passed to getToken() is the active one.
self.addEventListener('install', function (event) {
  console.log('[SW] install');
  self.skipWaiting();
});

// Take control of all open clients immediately after activation.
self.addEventListener('activate', function (event) {
  console.log('[SW] activate');
  event.waitUntil(clients.claim());
});

// Handle background messages (app closed or not in focus)
messaging.onBackgroundMessage(function (payload) {
  console.log('[SW] onBackgroundMessage:', payload);
  const title = (payload.notification && payload.notification.title) || 'Sage';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body: body,
  });
});
`.trim();

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Allow this SW to control the full / scope
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
