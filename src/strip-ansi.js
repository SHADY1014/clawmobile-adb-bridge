'use strict';

function ansiRegex(onlyFirst) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
  ].join('|');
  return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

module.exports = function stripAnsi(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  return string.replace(ansiRegex(), '');
};
