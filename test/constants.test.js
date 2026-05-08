const { describe, it } = require('node:test');
const assert = require('node:assert');
const { toKatakana, toHiragana, escapeLike } = require('../src/constants');

describe('toKatakana', () => {
  it('converts hiragana to katakana', () => {
    assert.strictEqual(toKatakana('あいうえお'), 'アイウエオ');
  });

  it('does not modify non-hiragana characters', () => {
    assert.strictEqual(toKatakana('漢字ABC'), '漢字ABC');
    assert.strictEqual(toKatakana('アイウ'), 'アイウ');
  });

  it('handles mixed strings', () => {
    assert.strictEqual(toKatakana('あいアイうえ'), 'アイアイウエ');
  });
});

describe('toHiragana', () => {
  it('converts katakana to hiragana', () => {
    assert.strictEqual(toHiragana('アイウエオ'), 'あいうえお');
  });

  it('does not modify non-katakana characters', () => {
    assert.strictEqual(toHiragana('漢字ABC'), '漢字ABC');
    assert.strictEqual(toHiragana('あいう'), 'あいう');
  });

  it('handles mixed strings', () => {
    assert.strictEqual(toHiragana('アイあいうエ'), 'あいあいうえ');
  });

  it('round-trips through toKatakana', () => {
    assert.strictEqual(toHiragana(toKatakana('あいうえお')), 'あいうえお');
    assert.strictEqual(toKatakana(toHiragana('アイウエオ')), 'アイウエオ');
  });
});

describe('escapeLike', () => {
  it('escapes backslash', () => {
    assert.strictEqual(escapeLike('a\\b'), 'a\\\\b');
  });

  it('escapes percent', () => {
    assert.strictEqual(escapeLike('100%'), '100\\%');
  });

  it('escapes underscore', () => {
    assert.strictEqual(escapeLike('a_b'), 'a\\_b');
  });

  it('escapes single quote', () => {
    assert.strictEqual(escapeLike("it's"), "it''s");
  });

  it('escapes combined special characters', () => {
    assert.strictEqual(escapeLike('100%_test'), '100\\%\\_test');
  });

  it('does not modify safe strings', () => {
    assert.strictEqual(escapeLike('hello world'), 'hello world');
    assert.strictEqual(escapeLike('こんにちは'), 'こんにちは');
  });
});
