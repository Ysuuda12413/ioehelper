import { useEffect } from 'react';
import { useTranscriber } from './hooks/useTranscriber';

/**
 * API Endpoint Component
 * Exposes transcription functionality via window object for external scripts
 * Usage: window.IOETranscribe(audioUrl).then(text => console.log(text))
 */

interface TranscribeRequest {
    audioUrl: string;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
}

let transcribeQueue: TranscribeRequest[] = [];
let isProcessing = false;

export function ApiEndpoint() {
    const transcriber = useTranscriber();

    useEffect(() => {
        // Make transcription function globally available
        (window as any).IOETranscribe = async (audioUrl: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                transcribeQueue.push({ audioUrl, resolve, reject });
                processQueue();
            });
        };

        // Helper function to process queue
        async function processQueue() {
            if (isProcessing || transcribeQueue.length === 0) return;

            isProcessing = true;
            const request = transcribeQueue.shift()!;

            try {
                console.log(`%c🎧 IOE Transcribe: Bắt đầu tải audio...`, 'color:#0ff;font-weight:bold');

                // Fetch audio file
                const response = await fetch(request.audioUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch audio: ${response.status}`);
                }

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                console.log(`%c⏳ IOE Transcribe: Đang xử lý với Whisper Tiny...`, 'color:#fa0;font-weight:bold');

                // Create audio context and decode
                const audioContext = new AudioContext({ sampleRate: 16000 });
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Get audio data
                let audio;
                if (audioBuffer.numberOfChannels === 2) {
                    const SCALING_FACTOR = Math.sqrt(2);
                    const left = audioBuffer.getChannelData(0);
                    const right = audioBuffer.getChannelData(1);
                    audio = new Float32Array(left.length);
                    for (let i = 0; i < audioBuffer.length; ++i) {
                        audio[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
                    }
                } else {
                    audio = audioBuffer.getChannelData(0);
                }

                // Start transcription
                transcriber.start(audio);

                // Wait for result
                const result = await new Promise<string>((resolveTranscript) => {
                    const checkInterval = setInterval(() => {
                        if (transcriber.output && transcriber.output.text) {
                            clearInterval(checkInterval);
                            resolveTranscript(transcriber.output.text);
                        }
                    }, 100);

                    // Timeout after 60 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolveTranscript('');
                    }, 60000);
                });

                console.log(`%c✅ IOE Transcribe: Hoàn thành!`, 'color:#0f0;font-weight:bold');
                console.log(`%c"${result}"`, 'color:#fff;font-size:13px;background:#030;padding:5px');

                request.resolve(result);

            } catch (error) {
                console.error(`%c❌ IOE Transcribe: Lỗi!`, 'color:#f00;font-weight:bold', error);
                request.reject(error as Error);
            } finally {
                isProcessing = false;
                // Process next in queue
                if (transcribeQueue.length > 0) {
                    setTimeout(processQueue, 100);
                }
            }
        }

        console.log('%c🚀 IOE API Endpoint Ready!', 'color:#0f0;font-weight:bold;font-size:14px');
        console.log('%c💡 Sử dụng: window.IOETranscribe(audioUrl)', 'color:#aaa');

    }, [transcriber]);

    return null; // This component doesn't render anything
}
