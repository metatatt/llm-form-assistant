export class Dataset {
    constructor(userId) {
      this._userId =userId;
      this._id = 'wi320';
      this._info = '';
      this._keyContain = '';
      this._endConnect = '';
      this._color = '';
      this._probability = '0.7';
    }
  

    async cvServiceCredentials() {
      try {
          const response = await fetch('/azureCVCredentials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cardId: this._id })
          });
  
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
  
          const { cvKey: keyContain, cvEndpoint: endConnect } = await response.json();
          
          return {
              keyContain,
              endConnect,
              probability: this._probability 
          };
      } catch (error) {
          console.error('There was a problem with the fetch operation:', error);
          // Handle errors as you see fit here. You may want to throw the error or return a default object.
      }
  }
  
  

  }
  
  