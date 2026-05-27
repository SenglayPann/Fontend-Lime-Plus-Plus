import '@testing-library/jest-dom';

// jsdom does not implement EventSource; useProjectLiveUpdates opens one,
// so provide a minimal no-op stub that records listeners.
class MockEventSource {
  static instances = [];
  url;
  readyState = 0;
  onopen = null;
  onerror = null;
  onmessage = null;
  listeners = new Map();
  constructor(url) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) {
    this.listeners.get(type)?.delete(fn);
  }
  close() {
    this.readyState = 2;
  }
}
global.EventSource = MockEventSource;
