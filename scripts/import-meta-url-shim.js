export const importMetaUrl = typeof document === 'undefined' ? new URL('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('file:' + __filename).href);
