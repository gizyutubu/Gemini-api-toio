(function(Scratch) {
  'use strict';

  class ToioGeminiExtension {
    constructor() {
      this.apiKey = '';
      this.lastResponse = '';
    }

    getInfo() {
      return {
        id: 'toiogemini',
        name: 'Gemini AI for toio',
        color1: '#4285F4',
        blocks: [
          {
            opcode: 'setApiKey',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Gemini APIキーを [KEY] に設定',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'YOUR_API_KEY' }
            }
          },
          {
            opcode: 'askGemini',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Gemini に指示: [PROMPT]',
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: 'toioの移動方向（前/右/左/後ろ）を1文字で答えて' }
            }
          },
          {
            opcode: 'getResponse',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Geminiの返答'
          }
        ]
      };
    }

    setApiKey(args) {
      this.apiKey = args.KEY;
    }

    async askGemini(args) {
      if (!this.apiKey) {
        this.lastResponse = 'APIキー未設定';
        return;
      }
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: args.PROMPT }] }]
          })
        });
        const data = await response.json();
        this.lastResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'エラー';
      } catch (e) {
        this.lastResponse = '通信エラー';
      }
    }

    getResponse() {
      return this.lastResponse;
    }
  }

  Scratch.extensions.register(new ToioGeminiExtension());
})(Scratch);
