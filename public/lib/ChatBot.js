export class ChatBot {

constructor(){
    this.chatMessages = document.querySelector("#chatDiv");
    this.instructDoc = '' ;
    this.socket = io();
};


async feedInput(cvResult, snipImage){
  console.log('input text', cvResult)
    const textKeys = cvResult.textKeys
    const textContent = cvResult.textContent
    const resultImage = await this.addBoundingBox(snipImage,textKeys) 
    this.addImage("user", resultImage)
    this.addText('bot', '...');
    const queryText = "You are an assistant tasked with helping complete Form 3602. Can you provide guidance on how to fill out these specific fields: " + textKeys + "? Additionally, can you provide more details based on this content: " + textContent + "? If you lack enough information, state so."
    try {
      const response = await this.callLangChain(queryText);
      console.log('bot--- ')
      console.log('bot response: ', response)

      this.addText('bot', response.text);

      const event = new Event('receivedGPTResponse')
      window.dispatchEvent(event);
     } catch (error) {
      console.log('There was a problem with the fetch operation:', error.message);
     }
}
async feedInputOLD(cvResult, snipImage){
    this.addText('bot', '...');
    const queryText = "Elaborate on or about: "+cvResult.text

    try {
      const response = await this.callLangChain(queryText);
      this.addText('bot', response.text);
      const event = new Event('receivedGPTResponse')
      window.dispatchEvent(event);
     } catch (error) {
      console.log('There was a problem with the fetch operation:', error.message);
     }
}

async callLangChain(queryText) {
  try {
      const response = await fetch('/openai', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: queryText }),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch data from the server.');
      }
      console.log('--bot response--?-', response.message)
      return await response.json();
  } catch (error) {
      throw new Error('An error occurred: ' + error.message);
  }
}


addText(sender, queryText) {
  console.log('mdRes ',queryText)
  const emoji = sender === 'bot' ? "👌" : "&#9986;";
  let containerElement;

  // Check if the #tempContainer element exists
  const tempContainer = document.querySelector("#tempContainer");

  if (sender === 'bot') {
    // If sender is 'bot', use tempContainer if it exists, otherwise create a new one
    containerElement = tempContainer ? tempContainer : document.createElement("div");
    containerElement.id = "tempContainer"
    // Clear the content of the container
    containerElement.innerHTML = "";
    containerElement.className = "talk-bubble tri-right left-in"; // Added this line
  } else {
    // If sender is not 'bot', remove the id from tempContainer if it exists
    if (tempContainer) {
      tempContainer.removeAttribute("id");
    }
    // Create a new container element
    containerElement = document.createElement("div");
    containerElement.className = "talk-bubble tri-right"; // Added this line
    containerElement.style.cssText = "background-color: transparent; border: 1px solid grey;";
  }

  const talkText = document.createElement("div"); // Added this line
  talkText.className = "talktext"; // Added this line
  talkText.innerHTML = `<span class="emoji-styling">${emoji}</span>`;
  containerElement.appendChild(talkText); // Added this line

  const parsedContent = this.commitParser(queryText)
  const chatMessage = this.markupChatMessage(parsedContent)
  containerElement.appendChild(chatMessage)

  this.chatMessages.appendChild(containerElement);
  this.chatMessages.appendChild(document.createElement("br"));
  this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

  this.addTextConsole(sender, parsedContent);

}
commitParser(content) {
  const results = [];
  const sections = content.split('==== END DIAGRAM ====').map(s => s.trim());

  sections.forEach(section => {
      if (section.includes('==== BEGIN DIAGRAM ====')) {
          const diagramContent = section.split('==== BEGIN DIAGRAM ====').pop().trim();
          results.push({ type: 'diagram', content: diagramContent });
          
          const textContentBeforeDiagram = section.split('==== BEGIN DIAGRAM ====').shift().trim();
          if (textContentBeforeDiagram) {
              results.unshift({ type: 'text', content: textContentBeforeDiagram });
          }
      } else if (section) {
          results.push({ type: 'text', content: section });
      }
  });

  return results;
}


markupChatMessage(parsedContent) {
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
}



  addTextConsole(sender, parsedContent){
    const stationId = document.getElementById('gridText').textContent;

    const log = {
      gridId: stationId,
      sender: sender,
      content: parsedContent  
    };

    this.socket.emit('botLog', log);
}

async addBoundingBox(imageBlob, textKeys) {
  console.log('textKeys ', textKeys)
  const resultImage = new Image();
  resultImage.src = URL.createObjectURL(imageBlob);

  // Wait for the image to load
  await new Promise(resolve => {
    resultImage.onload = resolve;
  });

  const originalWidth = resultImage.width;
  const originalHeight = resultImage.height;

  // Create a canvas and draw the loaded image
  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight + textKeys.length * 100; // Adjust canvas height for multiple predictions
  const ctx = canvas.getContext('2d');
  ctx.drawImage(resultImage, 0, 0, originalWidth, originalHeight);

  // Iterate through predictions and draw bounding boxes
  textKeys.forEach((key, index) => {
    const { text, boundingBox } = key;

    // Convert relative bounding box coordinates to pixel values
    const x = boundingBox.left
    const y = boundingBox.top
    const width = boundingBox.width
    const height = boundingBox.height

    // Draw bounding box
    ctx.strokeStyle = 'blue'; // Set the stroke color to red
    ctx.lineWidth = 2; // Set the line width as desired

    ctx.beginPath();
    ctx.rect(x, y, width, height); // Adjust y-coordinate for each prediction
    ctx.closePath(); // Close the path
    ctx.stroke(); // Stroke the path to draw the box

    // Adjust text placement for each prediction
    ctx.font = '16px Arial'; // You can customize the font and size
    ctx.fillStyle = 'red'; // You can change the text color
    ctx.fillText(`-${text}`, 5, originalHeight + 15 + index * 30); // Adjust text placement
  });

  const annotatedImage = new Image();
  annotatedImage.src = canvas.toDataURL('image/png');
  return annotatedImage;
}

addImage(sender, image) {
  const imgElement = document.createElement('img');
  imgElement.src = image.src; 
      // Style for horizontal centering
      imgElement.style.display = 'block';  // Block display to occupy full width
      imgElement.style.marginLeft = 'auto';  // Automatic left margin
      imgElement.style.marginRight = 'auto';  // Automatic right margin
  this.chatMessages.appendChild(imgElement);  
  this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
}

}