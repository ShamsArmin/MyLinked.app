const originalFetch = window.fetch.bind(window);

window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  return originalFetch(input, { ...init, credentials: "include" });
};
