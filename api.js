(function(Scratch) {
  'use strict';
  if (!Scratch) return;

  class GeminiToio {
    constructor() {
      this.apiKey = '';
      this.reply = '';
    }
    getInfo() {
      return {
        id: 'geminitoio',
        name: 'Gemini AI',
        color1: '#4285F4',
        blocks: [
          {
            opcode: 'setKey',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Gemini APIキーを [KEY] に設定',
            arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: '' } }
          },
          {
            opcode: 'ask',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Gemini に指示: [PROMPT]',
            arguments: { PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: '前、右、左、後ろのいずれか1文字で答えて' } }
          },
          {
            opcode: 'getReply',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Geminiの返答'
          }
        ]
      };
    }
    setKey(args) { this.apiKey = args.KEY; }
    async ask(args) {
      if (!this.apiKey) { this.reply = 'APIキー未設定'; return; }
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: args.PROMPT }] }] })
        });
        const data = await res.json();
        this.reply = data.candidates[0].content.parts[0].text.trim();
      } catch (e) {
        this.reply = 'エラー';
      }
    }
    getReply() { return this.reply; }
  }

  Scratch.extensions.register(new GeminiToio());
})(window.Scratch);
