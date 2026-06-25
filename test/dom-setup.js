// Minimal jsdom environment for DOM-dependent unit tests.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

// jsdom doesn't implement execCommand — record calls so wrappers can be tested.
globalThis.__execCalls = [];
dom.window.document.execCommand = (cmd, ui, val) => {
  globalThis.__execCalls.push([cmd, ui, val]);
  return true;
};
dom.window.document.queryCommandState = () => false;
dom.window.document.queryCommandValue = () => '';
