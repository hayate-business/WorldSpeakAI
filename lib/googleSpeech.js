import axios from 'axios';

const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY || 'AIzaSyDw8w1Ke5_ASnupq5siUVv9YH6_ssjE99Y';
const SPEECH_TO_TEXT_URL = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`;

export const transcribeAudio = async (audioBlob) => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Audio = await new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    // Detect audio format and prepare request body
    let encoding = 'WEBM_OPUS';
    let sampleRate = 48000;
    
    // Check blob type to determine encoding
    if (audioBlob.type) {
      if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) {
        encoding = 'MP4';
        sampleRate = 44100;
      } else if (audioBlob.type.includes('webm')) {
        encoding = 'WEBM_OPUS';
        sampleRate = 48000;
      } else if (audioBlob.type.includes('wav')) {
        encoding = 'LINEAR16';
        sampleRate = 44100;
      }
    }
    
    console.log('Audio blob type:', audioBlob.type, 'Using encoding:', encoding);
    
    const requestBody = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRate,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: base64Audio,
      },
    };

    // Send request to Google Cloud Speech-to-Text API
    const response = await axios.post(SPEECH_TO_TEXT_URL, requestBody);

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].alternatives[0].transcript;
    } else {
      throw new Error('No transcription results');
    }
  } catch (error) {
    console.error('Speech-to-Text error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};