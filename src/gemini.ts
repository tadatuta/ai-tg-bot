import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import * as fs from 'fs';
import * as path from 'path';

// Define the project and location from environment variables, or fallback to defaults
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || '';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// We use gemini-1.5-flash as the designated "Flash" model on Vertex AI
const MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash-002';

let vertexAI: VertexAI | null = null;

try {
    // Initialize Vertex with the project and location. 
    // It expects application default credentials or GOOGLE_APPLICATION_CREDENTIALS set.
    vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
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
    if (!vertexAI) {
        return 'Vertex AI is not configured correctly on the server.';
    }

    try {
        const generativeModel = vertexAI.getGenerativeModel({
            model: MODEL_ID,
            systemInstruction: basePrompt ? { role: 'system', parts: [{ text: basePrompt }] } : undefined,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
            ],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7,
            },
        });

        const responseStream = await generativeModel.generateContent({
            contents: [
                { role: 'user', parts: [{ text: userMessage }] }
            ]
        });

        if (
            responseStream.response.candidates &&
            responseStream.response.candidates.length > 0 &&
            responseStream.response.candidates[0].content.parts.length > 0
        ) {
            return responseStream.response.candidates[0].content.parts[0].text || 'No response generated.';
        }

        return 'Received an empty response from Gemini.';

    } catch (error) {
        console.error('Error generating content:', error);
        return 'Sorry, I encountered an error while processing your request.';
    }
}
