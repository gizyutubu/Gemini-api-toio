(function(Scratch) {
  'use strict';

  class WebToScratchBridge {
    constructor() {
      this.lastMessage = '';
      this.receivedEvent = false;

      // Web側と同じチャンネル名で待機
      this.channel = new BroadcastChannel('turbowarp-bridge');
      
      this.channel.onmessage = (event) => {
        this.lastMessage = String(event.data);
        this.receivedEvent = true;
        
        // ハットブロック（〜のとき）を発火
        Scratch.vm.runtime.startHats('webToScratchBridge_whenReceived');
      };
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
            text: 'Webからメッセージを受信したとき',
            isEdgeActivated: false
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
