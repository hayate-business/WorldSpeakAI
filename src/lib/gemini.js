import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCn8h8ragNlHy7F37kEx7_K8SIIznBuGDU');

export const sendMessageToGemini = async (message) => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate content
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);
    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};