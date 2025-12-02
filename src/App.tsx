import { useEffect, useRef, useState } from 'react';
import { useTranscriber } from './hooks/useTranscriber';

/**
 * Minimal IOE Helper - Whisper API
 * No UI, just API endpoint for transcription
 */

function App() {
    const transcriber = useTranscriber();
    const [status, setStatus] = useState('⏳ Loading Whisper model...');
    const processingRef = useRef(false);

    const transcriberRef = useRef(transcriber);

    useEffect(() => {
        transcriberRef.current = transcriber;
    }, [transcriber]);

    useEffect(() => {
        // Expose global API
        (window as any).IOETranscribe = async (audioUrl: string): Promise<string> => {
            if (processingRef.current) {
                throw new Error('Already processing another request. Please wait.');
            }

            processingRef.current = true;
            setStatus(`🎧 Processing: ${audioUrl.substring(0, 50)}...`);

            try {
                // Fetch and decode audio
                const response = await fetch(audioUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                // Decode audio to AudioBuffer
                const audioContext = new AudioContext({ sampleRate: 16000 });
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Start transcription using the latest transcriber ref
                transcriberRef.current.start(audioBuffer);

                // Wait for result with timeout
                const result = await new Promise<string>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Transcription timeout (60s)'));
                    }, 60000);

                    const checkInterval = setInterval(() => {
                        const currentTranscriber = transcriberRef.current;
                        if (currentTranscriber.output && currentTranscriber.output.text && !currentTranscriber.isBusy) {
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            resolve(currentTranscriber.output.text);
                        }
                        // Also check if it failed or stopped without text? 
                        // The hook doesn't seem to have an explicit error state exposed in output, 
                        // but isBusy goes false.
                        // If isBusy is false and we have text, we are done.
                        // If isBusy is false and NO text, maybe it hasn't started or failed?
                        // But we just called start().
                    }, 100);
                });

                setStatus(`✅ Done: "${result.substring(0, 50)}..."`);
                processingRef.current = false;
                return result;

            } catch (error: any) {
                setStatus(`❌ Error: ${error.message}`);
                processingRef.current = false;
                throw error;
            }
        };

        // Notify parent window if in iframe
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'IOE_READY' }, '*');
        }

        setStatus('✅ Whisper API Ready!');
        console.log('%c🚀 IOE Whisper API Ready!', 'color:#0f0;font-weight:bold;font-size:16px');
        console.log('%c💡 Use: window.IOETranscribe(audioUrl)', 'color:#aaa;font-size:12px');

    }, []); // Run once on mount, but use ref for latest state

    // Listen for postMessage requests
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.type === 'TRANSCRIBE_REQUEST') {
                try {
                    const result = await (window as any).IOETranscribe(event.data.audioUrl);
                    event.source?.postMessage({
                        type: 'TRANSCRIBE_RESPONSE',
                        requestId: event.data.requestId,
                        success: true,
                        text: result
                    }, { targetOrigin: '*' } as any);
                } catch (error: any) {
                    event.source?.postMessage({
                        type: 'TRANSCRIBE_RESPONSE',
                        requestId: event.data.requestId,
                        success: false,
                        error: error.message
                    }, { targetOrigin: '*' } as any);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    margin: '0 0 10px 0',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900
                }}>
                    🎧 IOE Whisper API
                </h1>

                <p style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    margin: '0 0 30px 0'
                }}>
                    Lightweight speech-to-text API for IOE
                </p>

                <div style={{
                    background: '#f7f7f7',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '20px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#333'
                }}>
                    <strong>Status:</strong> {status}
                </div>

                <div style={{
                    background: '#1e1e1e',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'left',
                    color: '#d4d4d4',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: '1.6'
                }}>
                    <div style={{ color: '#6a9955', marginBottom: '5px' }}>// API Usage:</div>
                    <div><span style={{ color: '#569cd6' }}>const</span> text = <span style={{ color: '#569cd6' }}>await</span> window.<span style={{ color: '#dcdcaa' }}>IOETranscribe</span>(audioUrl);</div>
                    <div style={{ color: '#6a9955', marginTop: '10px' }}>// Returns: transcribed text</div>
                </div>

                <p style={{
                    marginTop: '30px',
                    fontSize: '0.75rem',
                    color: '#999'
                }}>
                    Powered by Whisper Tiny • Runs in browser • No server needed
                </p>
            </div>
        </div>
    );
}

export default App;
