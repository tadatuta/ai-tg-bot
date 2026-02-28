import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Define the project and location from environment variables, or fallback to defaults
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || '';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// We use gemini-1.5-flash as the designated "Flash" model on Vertex AI
const MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash-002';

let genaiClient: GoogleGenAI | null = null;

try {
    // Initialize Vertex with the project and location. 
    // It expects application default credentials or GOOGLE_APPLICATION_CREDENTIALS set.
    genaiClient = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION
    });
} catch (e) {
    console.error('Failed to initialize Vertex AI client:', e);
}

// Load the base prompt
let basePrompt = '';
try {
    const promptPath = path.resolve(__dirname, '../../prompt.txt');
    if (fs.existsSync(promptPath)) {
        basePrompt = fs.readFileSync(promptPath, 'utf-8');
    } else {
        // Also try checking the root dir if deployed differently
        const rootPath = path.resolve(__dirname, '../prompt.txt');
        if (fs.existsSync(rootPath)) {
            basePrompt = fs.readFileSync(rootPath, 'utf-8');
        }
    }
} catch (e) {
    console.error('Error reading prompt.txt', e);
}

export async function generateResponse(userMessage: string): Promise<string> {
    if (!genaiClient) {
        return 'Vertex AI is not configured correctly on the server.';
    }

    try {
        const response = await genaiClient.models.generateContent({
            model: MODEL_ID,
            contents: userMessage,
            config: {
                systemInstruction: basePrompt ? basePrompt : undefined,
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                ],
                maxOutputTokens: 8192,
                temperature: 0.7,
            }
        });

        if (response.text) {
            return response.text;
        }

        return 'Received an empty response from Gemini.';

    } catch (error) {
        console.error('Error generating content:', error);
        return 'Sorry, I encountered an error while processing your request.';
    }
}
