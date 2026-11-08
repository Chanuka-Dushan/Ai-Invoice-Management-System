import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Sparkles, AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiClient } from '../../api/client';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionSuccess: (transcription: string) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionSuccess,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveRecognitionSupported, setIsLiveRecognitionSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsLiveRecognitionSupported(!!SpeechRecognition);

    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setInterimText('');
    setError(null);
  };

  const startRecording = async () => {
    setError(null);
    setInterimText('');
    setTranscription('');
    audioChunksRef.current = [];
    isRecordingRef.current = true;

    // 1. Try real-time in-browser speech recognition (Web Speech API)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let accumulatedFinal = '';
          let currentInterim = '';

          for (let i = 0; i < event.results.length; i++) {
            const resultItem = event.results[i];
            if (resultItem.isFinal) {
              accumulatedFinal += resultItem[0].transcript + ' ';
            } else {
              currentInterim += resultItem[0].transcript;
            }
          }

          if (accumulatedFinal.trim()) {
            setTranscription(accumulatedFinal.trim());
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access in your browser.');
          }
        };

        recognition.onend = () => {
          // Restart if recording is still active (browser auto-stops on brief pauses)
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch (err) {
              // ignore
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (speechErr) {
        console.warn('SpeechRecognition start failed, will rely on MediaRecorder:', speechErr);
      }
    }

    // 2. Also record audio via MediaRecorder for playback preview & server fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Unable to access microphone. Please grant browser microphone permissions.');
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // If interim text remained, flush to transcription cleanly
    if (interimText.trim()) {
      setTranscription((prev) => (prev ? `${prev} ${interimText.trim()}` : interimText.trim()));
      setInterimText('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitAudioForServerTranscription = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-instruction.webm');

      const response = await apiClient.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const text = response.data.transcription;
      if (text) {
        setTranscription(text);
      }
    } catch (err: any) {
      console.error('Server transcription error:', err);
      setError(
        err.response?.data?.message ||
          'Server audio transcription requires an API key in backend .env. You can type or review speech in the box below.',
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleApplyToInvoice = () => {
    const finalText = (transcription + (interimText ? ' ' + interimText : '')).trim();
    if (finalText) {
      onTranscriptionSuccess(finalText);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice with Voice"
      subtitle="Speak naturally into your microphone. Your words are transcribed live into an invoice draft."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Audio Visual Area */}
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          {isRecording ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/30">
                  <Mic className="w-8 h-8" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-black font-mono text-slate-800">{formatTime(recordingSeconds)}</p>
                <p className="text-xs text-rose-600 font-semibold animate-pulse mt-1 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  Listening to your voice... Speak clearly
                </p>
              </div>

              {/* Real-time live speech preview as speaking */}
              {(transcription || interimText) && (
                <div className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-left text-xs text-slate-700 font-medium max-h-24 overflow-y-auto shadow-inner">
                  <span>{transcription}</span>{' '}
                  <span className="text-indigo-600 italic">{interimText}</span>
                </div>
              )}

              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:scale-105"
              >
                <Square className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            </div>
          ) : audioUrl ? (
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Audio Captured ({formatTime(recordingSeconds)})
              </p>
              <audio src={audioUrl} controls className="w-full h-10 rounded-xl" />

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={cleanup}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-record
                </button>
                {!transcription && (
                  <button
                    type="button"
                    onClick={submitAudioForServerTranscription}
                    disabled={isTranscribing}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing on Server...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Server Transcribe
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">Click to Start Speaking</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  {isLiveRecognitionSupported
                    ? 'Live speech recognition is active. Your spoken words will be transcribed in real time.'
                    : 'Speak your invoicing details into the microphone.'}
                </p>
              </div>
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
              >
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            </div>
          )}
        </div>

        {/* Transcribed Text Review Area */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Transcribed Instruction
            </label>
            <span className="text-[11px] text-slate-400">You can edit the transcribed text here</span>
          </div>

          <textarea
            rows={4}
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Your transcribed spoken instruction will appear here. You can also type or make edits manually..."
            className="w-full text-sm p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-sans text-slate-800"
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!transcription.trim()}
              onClick={handleApplyToInvoice}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Invoice from Voice</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
