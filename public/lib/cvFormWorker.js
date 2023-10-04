self.addEventListener('message', async event => {
  console.log('cvResult***-1, worker')
  const { imageBlob, cvServiceCredentials } = event.data;
  const { keyContain, endConnect } = cvServiceCredentials;

  const ocrResponse = await fetch(`${endConnect}/vision/v3.0/ocr`, {
    method: 'POST',
    body: imageBlob,
    headers: {
      'Ocp-Apim-Subscription-Key': keyContain,
      'Content-Type': 'application/octet-stream'
    },
  });

  const ocrResult = await ocrResponse.json();
  console.log('OCR result**', ocrResult);

  // Just post the ocrResult to main thread
  self.postMessage(ocrResult);
});
