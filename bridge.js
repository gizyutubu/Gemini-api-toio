(function(Scratch) {
  'use strict';

  class WebToScratchBridge {
    constructor() {
      this.lastMessage = '';

      const handleMessage = (msg) => {
        this.lastMessage = String(msg);
        Scratch.vm.runtime.startHats('webToScratchBridge_whenReceived');
      };

      // BroadcastChannel 受信
      try {
        const channel = new BroadcastChannel('turbowarp-bridge');
        channel.onmessage = (e) => handleMessage(e.data);
      } catch(e) {}

      // localStorage 経由の受信
      window.addEventListener('storage', (e) => {
        if (e.key === 'scratch_bridge_msg' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data && data.text) {
              handleMessage(data.text);
            }
          } catch(err) {}
        }
      });
    }

    getInfo() {
      return {
        id: 'webToScratchBridge',
        name: 'Web通信ブリッジ',
        color1: '#0f766e',
        color2: '#0d9488',
        blocks: [
          {
            opcode: 'whenReceived',
            blockType: Scratch.BlockType.HAT,
            text: 'Webからメッセージを受信したとき'
          },
          {
            opcode: 'getLastMessage',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Webからの最新メッセージ'
          }
        ]
      };
    }

    getLastMessage() {
      return this.lastMessage;
    }
  }

  Scratch.extensions.register(new WebToScratchBridge());
})(Scratch);
