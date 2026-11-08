import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  async transcribeAudio(file: Express.Multer.File): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    const transcriptionKey = process.env.TRANSCRIPTION_API_KEY?.trim();
    const customWhisperUrl = process.env.WHISPER_API_URL?.trim();

    // 1. Google Gemini 1.5 Flash Audio Transcription
    if (geminiKey) {
      try {
        const base64Audio = file.buffer.toString('base64');
        const mimeType = file.mimetype || 'audio/webm';
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Audio,
                    },
                  },
                  {
                    text: 'Transcribe the speech in this voice recording accurately into English text. Return ONLY the transcribed words with proper punctuation, without any conversational filler, quotes, or markdown formatting.',
                  },
                ],
              },
            ],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        this.logger.error(`Gemini audio transcription failed: ${err.message}`);
      }
    }

    // 2. Groq Whisper (Ultra-fast whisper-large-v3)
    if (groqKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'audio/webm' });
        formData.append('file', blob, file.originalname || 'recording.webm');
        formData.append('model', 'whisper-large-v3');

        const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          timeout: 30000,
        });

        if (response.data?.text) {
          return response.data.text.trim();
        }
      } catch (err: any) {
        this.logger.error(`Groq Whisper transcription failed: ${err.message}`);
      }
    }

    // 3. OpenAI Whisper
    if (openAiKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'audio/webm' });
        formData.append('file', blob, file.originalname || 'recording.webm');
        formData.append('model', 'whisper-1');

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
          headers: {
            Authorization: `Bearer ${openAiKey}`,
          },
          timeout: 30000,
        });

        if (response.data?.text) {
          return response.data.text.trim();
        }
      } catch (err: any) {
        this.logger.error(`OpenAI Whisper transcription failed: ${err.message}`);
      }
    }

    // 4. Custom Whisper URL
    if (customWhisperUrl && transcriptionKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'audio/webm' });
        formData.append('file', blob, file.originalname || 'recording.webm');

        const response = await axios.post(customWhisperUrl, formData, {
          headers: {
            Authorization: `Bearer ${transcriptionKey}`,
          },
          timeout: 30000,
        });

        if (response.data?.text) {
          return response.data.text.trim();
        }
      } catch (err: any) {
        this.logger.error(`Custom Whisper transcription failed: ${err.message}`);
      }
    }

    throw new BadRequestException(
      'Server-side audio transcription requires an API key (GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY) in backend/.env. Alternatively, use the live in-browser speech recognition in Chrome/Edge.',
    );
  }
}
