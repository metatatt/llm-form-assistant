var app = new Vue({
  el: '#app',
  data: {
    userId: '',
    agoraUid: '',
    gridId: '',
    role: '',
    CSSfactor:0.8,
    statusAgora: '',
    socket: null,
    videoGridTable: [
      { gridId: 'grid-1', src: '', agoraUid: '', userId: '', statusAgora: '', available: true },
      { gridId: 'grid-2', src: '', agoraUid: '', userId: '', statusAgora: '', available: true },
      { gridId: 'grid-3', src: '', agoraUid: '', userId: '', statusAgora: '', available: true },
      { gridId: 'grid-4', src: '', agoraUid: '', userId: '', statusAgora: '', available: true },
      { gridId: 'grid-5', src: '', agoraUid: '', userId: '', statusAgora: '', available: true }
    ],
    client: null,
    localTrack: null,
    remoteUsers: {}
  },
  mounted() {
    this.socket = io(); // Initialize socket connection
    this.socket.emit('query','hi')
    this.socket.on('stationLog', (log) => {
        console.log('log ', log)
        this.updateGridTable(log.gridId, log.agoraUid, log.userId);
    });
    this.socket.on('botLog', (log) => {
      console.log('log ', log.content)
      this.addChatText(log.gridId, log.sender, log.content);
  });

    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
    this.client.on('user-published', this.showAgoraVideo);
    this.main()
  },
  methods: {

    main(){
      this.joinAgoraRoom();
    },

    async updateGridTable(gridId, agoraUid, userId) {
        const index = this.videoGridTable.findIndex(entry => entry.agoraUid === agoraUid);
        const entryToUpdate = { agoraUid, gridId, userId };
        
        if (index !== -1) {
          // Update the entry in videoGridTable if it exists
          this.videoGridTable[index] = entryToUpdate;
        } else {
          // Append a new entry to videoGridTable if agoraUid is not found
          this.videoGridTable.push(entryToUpdate);
        }
    },
    async showAgoraVideo (user, mediaType) {
      this.remoteUsers[user.uid] = user;
    
      const matchingEntry = this.videoGridTable.find(entry => entry.agoraUid === user.uid);
      let gridId = '';
    
      if (matchingEntry) {
        // If a matching entry is found, set gridId to its value
        gridId = matchingEntry.gridId;
      }
    
      await this.client.subscribe(user, mediaType);
      const remoteStream = user.videoTrack;
      const videoElement = document.getElementById(gridId);
      const videoElement1 = document.getElementById('grid-1');
      if (videoElement && remoteStream) {
        remoteStream.play(videoElement);
      }
  },

  async joinAgoraRoom() {
    const response = await fetch('/agoraCredentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: this.userId })
    });
    
    const data = await response.json();
    this.agoraUid = await this.client.join(data.APP_ID, data.CHANNEL, data.TOKEN, null);
  },

  async addChatText(gridId, sender, parsedContent){
    const emoji = sender === 'bot' ? "👌" : "&#9986;";
    console.log('updateChat ', parsedContent)
    const containerElement = document.getElementById(gridId).querySelector('#chatDiv');
    const senderContainer = document.createElement("div")
    senderContainer.innerHTML = `<span class="emoji-styling">${emoji}</span>`;
    containerElement.appendChild(senderContainer)
    const chatMessage = await this.markupChatMessage(parsedContent)
    console.log('updateChat2 ', chatMessage)
    containerElement.appendChild(chatMessage)
    console.log('--')
    containerElement.appendChild(document.createElement("br"));
    console.log('--')
    containerElement.scrollTop = containerElement.scrollHeight;
  },

  async markupChatMessage(parsedContent) {
    const chatContainer = document.createElement('div');
  
    parsedContent.forEach(item => {
        const element = document.createElement(item.type === 'text' ? 'div' : 'canvas');
        if (item.type === 'text') {
            element.innerText = item.content;
        } else {
            element.style.display = "block";  // Set canvas to block
            element.style.margin = "auto";    // Center it horizontally
            nomnoml.draw(element, item.content);
        }
        chatContainer.appendChild(element);
    });
  
    return chatContainer;
  },

  }

}

);
