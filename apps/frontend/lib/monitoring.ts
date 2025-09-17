import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry monitoring only if DSN is configured
 * Handles unhandled promise rejections and other error tracking
 */
export function initializeMonitoring() {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', /^\//],
      }),
    ],
  });

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      Sentry.captureException(event.reason);
    });
  }

  console.log('Sentry monitoring initialized');
}

/**
 * Capture an exception to Sentry if initialized
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, context);
  } else {
    console.error('Error (Sentry not configured):', error, context);
  }
}

/**
 * Capture a message to Sentry if initialized
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`Message (Sentry not configured) [${level}]:`, message);
  }
}