import { joinAgoraRoom, HandGesture } from './lib/HandGesture.js';
import { Dataset } from './lib/Dataset.js';
import { CheckResult } from './lib/CheckResult.js';
import { VoiceCommand } from './lib/VoiceCommand.js';
import { ChatBot } from './lib/ChatBot.js';


var HandCheckrApp = new Vue({
  el: '#handCheckr',
  data: {
    datasetId: '-na-',
    promptText: 'say "check"...',
    gridId: "",
    userId: null,
  },

  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    // 06-14 to mask userId for dev Ngrok test on iPad
    // this.userId = userId;
    this.userId = "2XXX9-SIXDI%20Chen"; //for use in develop testing Ngrok/iPad
    this.videoElement = document.getElementById("video");
    this.canvasElement = document.getElementById("canvas");
    this.ctx = this.canvasElement.getContext("2d", { willReadFrequently: true });
    this.webRtc = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
    this.main();
  },

  methods: {

    async main() {
      this.loadComponents();
      this.loadFlowHandlers();
      this.loadUtilitiesHandlers();
      this.startAgora();
      this.handGesture.start();
      this.voiceCommand.start();
    },


    loadComponents() {
      this.voiceCommand = new VoiceCommand();
      this.dataset = new Dataset("2XXX9-SIXDI%20Chen", this);
      this.checkResult = new CheckResult();
      this.handGesture = new HandGesture(this.canvasElement,this.videoElement);
      this.chatBot = new ChatBot();
      this.socket = io(); // Initialize socket connection
    },

    async loadFlowHandlers() {
      this.cvServiceCredentials = await this.dataset.cvServiceCredentials()
      window.addEventListener('voiceCommandCheck', () => {
        this.promptText = 'now checking...'
        this.checkSnapShot();
      });

      window.addEventListener('cvResultReady', () => {
        console.log('cvResult**4 eventListener')
        this.promptText = 'ready...'
        this.feedInput()
      });

      window.addEventListener('receivedGPTResponse', () => {
        this.promptText = 'say "check"...'
      });

    },

    async loadUtilitiesHandlers() {
      window.addEventListener('newDataset', () => {
        this.onNewDataset();
      });

    this.socket.on('query', () => {
        this.sendStationResponse();
      });
    },

    async checkSnapShot() {
      const imageBlob = await this.handGesture.makeSnapShot();
      this.checkResult.reqeustCvService(imageBlob, this.cvServiceCredentials);
    },

    
    async feedInput(){
      console.log('chatGPT**6')
      const cvResult = this.checkResult._result
      const snipImage = this.checkResult._imageBlob
      console.log('result-', cvResult)
      this.chatBot.feedInput(cvResult,snipImage);
    },
    
    async startAgora() {
      await joinAgoraRoom.call(this);
    },

    sendStationResponse(){
      this.socket.emit('stationLog', {
        gridId: this.gridId,
        agoraUid: this.agoraUid,
        userId: this.userId,
      });
    },

  },
});
