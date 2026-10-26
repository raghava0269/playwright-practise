/**
 * ApiClient — generic wrapper around Playwright's APIRequestContext
 * (the built-in `request` fixture). Covers every HTTP method.
 */
export class ApiClient {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
  }

  get(url, params = {}) {
    return this.request.get(url, { params });
  }

  post(url, data) {
    return this.request.post(url, { data });
  }

  put(url, data) {
    return this.request.put(url, { data });
  }

  patch(url, data) {
    return this.request.patch(url, { data });
  }

  delete(url) {
    return this.request.delete(url);
  }

  head(url) {
    return this.request.head(url);
  }

  /** OPTIONS has no shortcut, so use the generic fetch(). */
  options(url) {
    return this.request.fetch(url, { method: 'OPTIONS' });
  }
}
