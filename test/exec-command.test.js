import './dom-setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFormat, queryFormatState, queryFormatValue } from '../lib/utils/exec-command.js';

beforeEach(() => { globalThis.__execCalls.length = 0; });

test('execFormat omits the value argument when none is given', () => {
  execFormat('insertHorizontalRule');
  const call = globalThis.__execCalls.at(-1);
  // [cmd, false] — third arg undefined so commands like hr don't get id="null"
  assert.equal(call[0], 'insertHorizontalRule');
  assert.equal(call[2], undefined);
});

test('execFormat passes the value when provided', () => {
  execFormat('foreColor', '#ff0000');
  const call = globalThis.__execCalls.at(-1);
  assert.deepEqual(call, ['foreColor', false, '#ff0000']);
});

test('queryFormatState / queryFormatValue never throw', () => {
  assert.equal(queryFormatState('bold'), false);
  assert.equal(queryFormatValue('fontSize'), '');
});
