// Android Termux clipboard stub for @mariozechner/clipboard
// Provides no-op implementations for all clipboard functions
// Uses termux-clipboard-get/set when available

const { execSync } = require('child_process');

function tryTermuxClipboardGet() {
  try {
    return execSync('termux-clipboard-get', { encoding: 'utf8', timeout: 2000 }).trim();
  } catch (e) {
    return '';
  }
}

function tryTermuxClipboardSet(text) {
  try {
    execSync('termux-clipboard-set', { input: text, timeout: 2000 });
    return true;
  } catch (e) {
    return false;
  }
}

function dummyWatcher() {
  return { stop: () => {} };
}

const availableFormats = () => [];
const getText = () => tryTermuxClipboardGet();
const setText = (text) => tryTermuxClipboardSet(text);
const hasText = () => false;
const getImageBinary = () => null;
const getImageBase64 = () => null;
const setImageBinary = () => false;
const setImageBase64 = () => false;
const hasImage = () => false;
const getHtml = () => '';
const setHtml = () => false;
const hasHtml = () => false;
const getRtf = () => '';
const setRtf = () => false;
const hasRtf = () => false;
const clear = () => {};
const watch = () => dummyWatcher();
const callThreadsafeFunction = () => {};

module.exports = {
  availableFormats,
  getText,
  setText,
  hasText,
  getImageBinary,
  getImageBase64,
  setImageBinary,
  setImageBase64,
  hasImage,
  getHtml,
  setHtml,
  hasHtml,
  getRtf,
  setRtf,
  hasRtf,
  clear,
  watch,
  callThreadsafeFunction
};
