export class VoiceCommand {
    constructor() {
      this.sequenceInput = document.querySelector('#sequenceInput');
      this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      this.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
      this.phrases = ['check', 'check again'];
      this.recognition = new this.SpeechRecognition();
    }

    start(){
    if (this.SpeechGrammarList) {
          const speechRecognitionList = new this.SpeechGrammarList();
          const grammar = '#JSGF V1.0; grammar phrases; public <phrase> = ' + this.phrases.join(' | ') + ' </phrase>;';
          speechRecognitionList.addFromString(grammar, 1);
          this.recognition.grammars = speechRecognitionList;
    }
        this.recognition.continuous = true; // Change to continuous recognition upon window start
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        const self = this;

        this.recognition.onresult = function (event) {
          var phrase = event.results[event.results.length - 1][0].transcript; // Get the latest result
            console.log('listen->',phrase)
            const phraseB = phrase.includes('check')
          if (phraseB) {
            const event = new Event('voiceCommandCheck');
            window.dispatchEvent(event);
          }
            console.log('Confidence-> ' + event.results[event.results.length - 1][0].confidence);
          };
  
        self.recognition.start();
    
        this.recognition.onnomatch = function (event) {
        console.log( "I didn't recognize that command.")
        };
    
        this.recognition.soundend = function (event) {
        console.log( "sound end...")
        };
        
        this.recognition.onend = function (event) {
        console.log("SessionEnd restarting: ");
        self.recognition.start();
        };
        this.recognition.onerror = function (event) {
        console.log('Error occurred in recognition: ', event.error);
        };
    }
  }
  
  