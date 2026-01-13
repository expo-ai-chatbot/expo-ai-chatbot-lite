import { auth } from '@/app/(auth)/auth';
import { verifyToken, extractTokenFromHeader } from '@/lib/native-auth/tokens';
import OpenAI from 'openai';

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing OpenAI API Key. Please set OPENAI_API_KEY in your .env');
}

const openai = new OpenAI({ apiKey: API_KEY });

/**
 * API route for transcribing audio files using OpenAI's Whisper model
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Try token auth first
    let userId: string | undefined;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          userId = payload.id;
        }
      }
    }

    // If no token or invalid token, try session auth
    if (!userId) {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }

    // If no valid auth found
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('🚀 ~ POST ~ audioFile:', audioFile);
    console.log('🚀 ~ POST ~ audioFile.type:', audioFile.type);
    console.log('🚀 ~ POST ~ audioFile.name:', audioFile.name);
    console.log('🚀 ~ POST ~ audioFile.size:', audioFile.size);

    // Check if the file has actual content
    if (audioFile.size < 100) {
      console.error('🚀 ~ POST ~ File too small, likely empty or corrupted');
      return Response.json({
        error: 'Audio file is too small or empty. Please ensure the recording captured audio properly.'
      }, { status: 400 });
    }

    // Convert to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🚀 ~ POST ~ Transcribing audio buffer, size:', buffer.length);

    // Create a File object with proper format for OpenAI SDK
    const audioBlob = new Blob([buffer], { type: 'audio/m4a' });
    const file = new File([audioBlob], 'recording.m4a', { type: 'audio/m4a' });

    // Use OpenAI SDK directly for better control
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    console.log('🚀 ~ POST ~ Transcription successful:', transcription.text);
    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error('🚀 ~ POST ~ error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
    return Response.json({ error: errorMessage, details: String(error) }, { status: 500 });
  }
} 
