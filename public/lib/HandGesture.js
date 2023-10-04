export async function joinAgoraRoom() {

    const response = await fetch('/agoraCredentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: this.userId })
    });
    
    const data = await response.json();
    this.agoraUid = await this.webRtc.join(data.APP_ID, data.CHANNEL, data.TOKEN, null);
    this.gridId = data.GRIDID;
    document.querySelector('#gridText').textContent = this.gridId;
    console.log('agora')
    console.log('agoraUID ', this.agoraUid)
    const cameraOptions = {
      facingMode: "environment",
      videoProfile: "1080p_2" 
    };
    this.localTrack = await AgoraRTC.createCameraVideoTrack(cameraOptions);

      // Set the audioEnabled option to false to prevent microphone access
    const microphoneOptions = {
      microphoneId: '', // Set the appropriate microphone ID if needed
      audioEnabled: false
    };
    await this.webRtc.publish(this.localTrack);

    this.socket.emit('stationLog', {
        gridId: this.gridId,
        agoraUid: this.agoraUid,
        userId: this.userId
    });
  }

  export class HandGesture {
    constructor(canvasElement, videoElement) {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.ctx = canvasElement.getContext("2d", { willReadFrequently: true });
      this.cornerTL=[];
      this.boxSize = 500;
    }

    async start(){
      const constraints = {
        video: {
          facingMode: "environment",
          width: 1024,
          height: 768
        }
      };
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoElement.srcObject = stream;
        this.videoElement.setAttribute("playsinline", true);
        this.videoElement.play();
        this.videoElement.onplaying = () => {
        this.drawBox();
        };

      } catch (error) {
        console.log("#setUpVideo -Unable to access video stream:", error);
      }
    }

drawBox() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  
      // Define box dimensions
      const x = (this.canvasElement.width - this.boxSize) / 2;
      const y = (this.canvasElement.height - this.boxSize) / 2;
      this.cornerTL = {x, y}
      // Draw the box
      this.ctx.strokeStyle = 'red';  // Color of the box
      this.ctx.lineWidth = 2;        // Line width
      this.ctx.strokeRect(x, y, this.boxSize, this.boxSize);
}
  
makeSnapShot() {
  const { x, y } = this.cornerTL;
  const size = this.boxSize;

  // Create a new canvas element
  const newCanvas = document.createElement('canvas');
  newCanvas.width = size;
  newCanvas.height = size;
  const newCtx = newCanvas.getContext('2d');

  // Draw the specific region (square) from the video element onto the canvas
  newCtx.drawImage(this.videoElement, x, y, size, size, 0, 0, size, size);

  // Convert the canvas to a Blob (image format) and return it
  const imageBlobPromise = new Promise(resolve => {
    newCanvas.toBlob(blob => {
      resolve(blob);
    }, 'image/png'); // Change to 'image/jpeg' if needed
  });

  return imageBlobPromise;
}

}
