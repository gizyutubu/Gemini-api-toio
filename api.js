(function(Scratch) {
  'use strict';

  class GeminiApiToioPro {
    constructor() {
      this.apiKey = '';
      this.model = 'gemini-1.5-flash';
      this.systemInstruction = 'あなたは toio ロボットの管理者です。ユーザーの要望に応じて、toio を動かすための方向（前, 後, 左, 右, 停止）やパラメータを推論して出力してください。';
      this.temperature = 0.7;
      this.maxTokens = 1024;
      this.chatHistory = [];
      this.lastResponse = '';
      this.lastAction = '停止';
      this.lastRawJson = '{}';
      this.isProcessing = false;
    }

    getInfo() {
      return {
        id: 'geminiApiToio',
        name: 'Gemini AI Ultra for toio',
        color1: '#1a73e8',
        color2: '#1557b0',
        color3: '#0d47a1',
        blocks: [
          '--- 基本設定 ---',
          {
            opcode: 'setApiKey',
            blockType: Scratch.BlockType.COMMAND,
            text: 'APIキーを [KEY] に設定',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'YOUR_GEMINI_API_KEY' }
            }
          },
          {
            opcode: 'setModel',
            blockType: Scratch.BlockType.COMMAND,
            text: 'モデルを [MODEL] に変更',
            arguments: {
              MODEL: {
                type: Scratch.ArgumentType.STRING,
                menu: 'modelMenu',
                defaultValue: 'gemini-1.5-flash'
              }
            }
          },
          {
            opcode: 'setSystemInstruction',
            blockType: Scratch.BlockType.COMMAND,
            text: 'AIのシステム指示を [INSTRUCTION] に設定',
            arguments: {
              INSTRUCTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'あなたはtoioを操作する優秀なナビゲーターです。'
              }
            }
          },
          {
            opcode: 'setParameters',
            blockType: Scratch.BlockType.COMMAND,
            text: '創造性 (Temperature) [TEMP] / 最大トークン [MAX]',
            arguments: {
              TEMP: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.7 },
              MAX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 512 }
            }
          },

          '対話 & 推論',
          {
            opcode: 'askGemini',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Gemini に送信: [PROMPT]',
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: 'こんにちは！' }
            }
          },
          {
            opcode: 'askGeminiChat',
            blockType: Scratch.BlockType.REPORTER,
            text: '会話履歴つきで送信: [PROMPT]',
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: 'さっきの指示の続きを実行して' }
            }
          },

          '--- toio 専用アクション解析 ---',
          {
            opcode: 'askToioAction',
            blockType: Scratch.BlockType.REPORTER,
            text: 'toioの移動方向をAIに判定させる: [PROMPT]',
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: '障害物を避けて右に旋回して' }
            }
          },
          {
            opcode: 'getLastAction',
            blockType: Scratch.BlockType.REPORTER,
            text: '最新の抽出アクション (前/後/左/右/停止)'
          },

          '--- JSON / 構造化データ解析 ---',
          {
            opcode: 'askGeminiJson',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON形式でGeminiに回答させる: [PROMPT]',
            arguments: {
              PROMPT: { type: Scratch.ArgumentType.STRING, defaultValue: 'action: "前", speed: 50, time: 2 の形式で出力して' }
            }
          },
          {
            opcode: 'getJsonValue',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSONレスポンスのキー [KEY] の値を取得',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'action' }
            }
          },

          '--- 状態 & ユーティリティ ---',
          {
            opcode: 'clearHistory',
            blockType: Scratch.BlockType.COMMAND,
            text: '会話履歴を全消去'
          },
          {
            opcode: 'getLastResponse',
            blockType: Scratch.BlockType.REPORTER,
            text: '最後のレスポンス全文'
          },
          {
            opcode: 'isBusy',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'AIが処理中？'
          }
        ],
        menus: {
          modelMenu: {
            acceptReporters: true,
            items: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
          }
        }
      };
    }

    // --- Block Implementations ---
    setApiKey(args) { this.apiKey = Scratch.Cast.toString(args.KEY).trim(); }
    setModel(args) { this.model = Scratch.Cast.toString(args.MODEL).trim(); }
    setSystemInstruction(args) { this.systemInstruction = Scratch.Cast.toString(args.INSTRUCTION); }
    
    setParameters(args) {
      this.temperature = Math.min(Math.max(Scratch.Cast.toNumber(args.TEMP), 0.0), 2.0);
      this.maxTokens = Math.max(Scratch.Cast.toNumber(args.MAX), 1);
    }

    clearHistory() { this.chatHistory = []; }
    getLastResponse() { return this.lastResponse; }
    getLastAction() { return this.lastAction; }
    isBusy() { return this.isProcessing; }

    async askGemini(args) {
      const prompt = Scratch.Cast.toString(args.PROMPT);
      return await this._request([{ role: 'user', parts: [{ text: prompt }] }]);
    }

    async askGeminiChat(args) {
      const prompt = Scratch.Cast.toString(args.PROMPT);
      this.chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
      const reply = await this._request(this.chatHistory);
      if (reply && !reply.startsWith('Error:')) {
        this.chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      }
      return reply;
    }

    async askToioAction(args) {
      const prompt = Scratch.Cast.toString(args.PROMPT);
      const systemBackup = this.systemInstruction;
      
      this.systemInstruction += '\n【重要】回答には必ず [前], [後], [左], [右], [停止] のいずれか1つのキーワードを含めてください。';
      const response = await this.askGemini({ PROMPT: prompt });
      this.systemInstruction = systemBackup;

      if (response.includes('前')) this.lastAction = '前';
      else if (response.includes('後') || response.includes('後ろ')) this.lastAction = '後';
      else if (response.includes('左')) this.lastAction = '左';
      else if (response.includes('右')) this.lastAction = '右';
      else this.lastAction = '停止';

      return this.lastAction;
    }

    async askGeminiJson(args) {
      const prompt = Scratch.Cast.toString(args.PROMPT);
      const res = await this._request([{ role: 'user', parts: [{ text: prompt }] }], 'application/json');
      this.lastRawJson = res;
      return res;
    }

    getJsonValue(args) {
      const key = Scratch.Cast.toString(args.KEY);
      try {
        const parsed = JSON.parse(this.lastRawJson);
        return parsed[key] !== undefined ? String(parsed[key]) : '';
      } catch (e) {
        return '';
      }
    }

    // --- Core Request Engine ---
    async _request(contents, mimeType = 'text/plain') {
      if (!this.apiKey) {
        this.lastResponse = 'Error: APIキーが設定されていません。';
        return this.lastResponse;
      }

      this.isProcessing = true;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: this.systemInstruction }] },
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          responseMimeType: mimeType
        }
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        this.isProcessing = false;

        if (data.candidates && data.candidates[0].content.parts[0].text) {
          this.lastResponse = data.candidates[0].content.parts[0].text;
          return this.lastResponse;
        } else if (data.error) {
          this.lastResponse = `Error: ${data.error.message}`;
          return this.lastResponse;
        } else {
          this.lastResponse = 'Error: レスポンスが空です';
          return this.lastResponse;
        }
      } catch (err) {
        this.isProcessing = false;
        this.lastResponse = `Error: ${err.message}`;
        return this.lastResponse;
      }
    }
  }

  Scratch.extensions.register(new GeminiApiToioPro());
})(Scratch);
