import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserSession } from '@/lib/firebaseAuth';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      console.error('Authentication failed: No user ID in cookies');
      return NextResponse.json(
        { error: 'You must be signed in to use this API.' },
        { status: 401 }
      );
    }
    
    // Get user session from Firebase
    const userSession = await getUserSession(userId);
    
    if (!userSession) {
      console.error('Authentication failed: No user session found in Firebase');
      return NextResponse.json(
        { error: 'Your session has expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // Parse the FormData
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert the audio file to an ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file with the correct extension
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `recording-${Date.now()}.webm`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, buffer);
    
    try {
      console.log('Sending audio to OpenAI for transcription');
      
      // Use OpenAI's Whisper API for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en"
      });
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return NextResponse.json({ text: transcription.text });
    } catch (transcriptionError) {
      console.error('OpenAI transcription error:', transcriptionError);
      
      // Clean up the temporary file even if transcription fails
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      throw transcriptionError;
    }
  } catch (error) {
    console.error('Error in transcription API:', error);
    return NextResponse.json(
      { error: 'An error occurred during transcription.' },
      { status: 500 }
    );
  }
}
