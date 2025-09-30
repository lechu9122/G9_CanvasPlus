// Guarantees the Google Identity script is present before you use it.
export function loadGoogleIdentity() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Browser environment required for Google Identity Services'));
    }

    // Already loaded?
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return resolve();
    }

    // If a script is already in-flight, wait for it
    const existing = document.querySelector('script[data-gsi-script="true"]');
    if (existing) {
      const done = () => resolve();
      const fail = () => reject(new Error('Failed to load Google Identity script'));
      if (window.google?.accounts?.oauth2) return resolve();
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', fail, { once: true });
      return;
    }

    // Inject new script
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-gsi-script', 'true');
    s.onload = () => {
      if (window.google?.accounts?.oauth2) resolve();
      else reject(new Error('Google Identity Services not available after script load'));
    };
    s.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(s);
  });
}
