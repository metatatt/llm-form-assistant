export class CheckResult {
    constructor() {
      this._id = '';
      this._imageBlob = null;
      this._boxLoc = '';
      this._isQRCode = false;
      this._isTarget = false;
      this._qrCodeContent = '';
      this._result = {
        textContent:'',
        textKeys: [],
      };
      this.keys = [
        "1. Name of business",
        "2a. Organization ID Number",
        "3. Address where",
        "4. Name of person making this"
      ];
          // Initialize the checkWorker and add event listener
       this.cvWorker = new Worker('./lib/cvFormWorker.js');
        this.cvWorker.addEventListener('message', event => {
        this.showCVResult(event.data);
        });
    }
  
    reqeustCvService(imageBlob, cvServiceCredentials){
      this._imageBlob = imageBlob
      const content = {
        imageBlob: imageBlob,
        cvServiceCredentials: cvServiceCredentials,
      };
      this.cvWorker.postMessage(content)
    }
  
  showCVResult(eventData) {
      const { textContent, textKeys } = this.transformResult(eventData);
      Object.assign(this._result, { textContent, textKeys });
  
      console.log('cvResult text:', textContent);
      console.log('cvResult  key:', textKeys);
      console.log('this _res', this._result)
      const event = new Event('cvResultReady');
      window.dispatchEvent(event);
  }
  
  transformResult(ocrResult) {
      const textKeys = [];
      let textContent = '';
  
      // Key phrases to search for
      if (ocrResult.regions && Array.isArray(ocrResult.regions)) {
          for (const region of ocrResult.regions) {
              for (const line of region.lines) {
                  const lineText = line.words.map(word => word.text).join(" ");
                  textContent += lineText + ' ';
  
                  // Check if the current line matches any of our key phrases
                  this.keys.forEach((key, index) => {
                      if (lineText.includes(key)) {
                          textKeys.push({
                              "text": key,
                              "boundingBox": {
                                  "left": +line.boundingBox.split(',')[0],
                                  "top": +line.boundingBox.split(',')[1],
                                  "width": +line.boundingBox.split(',')[2],
                                  "height": +line.boundingBox.split(',')[3]
                              }
                          });
                      }
                  });
              }
          }
      }
      return { textContent, textKeys };
  }
  
  //textKeys
  // [
  //   {
  //     "text": "MDUFA SMALL BUSINESS",
  //     "boundingBox": below for example
  //   },
  //   {
  //     "text": "1. Name of business requesting",
  //     "boundingBox": {
  //       "left": 10,
  //       "top": 60,
  //       "width": 250,
  //       "height": 15
  //     }
  //   },
  //   ... // other keys
  // ]
    
}

  