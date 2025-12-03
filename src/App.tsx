import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@gradio/client';

// Regex to find audio links
const AUDIO_REGEX = /(https?:\/\/[^\s]+?\.(?:mp3|wav)|[\w./\\-]+\.(?:mp3|wav))/gi;

interface LogEntry {
    time: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

// NVIDIA Parakeet TDT V3 - Gradio Space (FREE, no API key!)
const GRADIO_SPACE = "nvidia/parakeet-tdt-0.6b-v3";

function App() {
    const [inputContent, setInputContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [processedContent, setProcessedContent] = useState('');
    const [concurrency, setConcurrency] = useState(3);

    const stopSignalRef = useRef(false);
    const gradioClientRef = useRef<any>(null);

    // Cache
    const [cache, setCache] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('ioe_transcribe_cache_parakeet');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('ioe_transcribe_cache_parakeet', JSON.stringify(cache));
    }, [cache]);

    const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ time, message, type }, ...prev].slice(0, 100));
    }, []);

    // Initialize Gradio client
    useEffect(() => {
        const initClient = async () => {
            try {
                addLog("🔗 Connecting to Parakeet V3 API...", 'info');
                const client = await Client.connect(GRADIO_SPACE);
                gradioClientRef.current = client;
                addLog("✅ Connected to Parakeet V3!", 'success');

                // Expose global API for ioe.js
                (window as any).ParakeetAPI = {
                    transcribe: async (url: string) => {
                        return await transcribeWithParakeet(url);
                    },
                    isReady: () => !!gradioClientRef.current
                };
                console.log("%c✅ ParakeetAPI Ready!", "color:#0f0;font-weight:bold");
                console.log("%c💡 Usage: await ParakeetAPI.transcribe(audioUrl)", "color:#aaa");

            } catch (e: any) {
                addLog(`❌ Failed to connect: ${e.message}`, 'error');
            }
        };

        initClient();

        return () => {
            if (gradioClientRef.current) {
                gradioClientRef.current.close?.();
            }
        };
    }, []);

    // Transcribe using Gradio API
    const transcribeWithParakeet = async (url: string): Promise<string> => {
        if (!gradioClientRef.current) {
            throw new Error("Gradio client not initialized");
        }

        try {
            // 1. Download audio file
            const audioResponse = await fetch(url);
            if (!audioResponse.ok) throw new Error(`Failed to fetch: ${audioResponse.status}`);

            const audioBlob = await audioResponse.blob();

            // 2. Call Gradio /transcribe_file endpoint
            const result = await gradioClientRef.current.predict("/transcribe_file", {
                audio_path: audioBlob
            });

            // Debug logging
            console.log("🔍 Gradio result structure:", result);
            console.log("🔍 Gradio data:", result?.data);

            // Parse result - try multiple methods
            if (result && result.data) {
                const data = result.data;

                // Method 1: Check if data[0] contains segments
                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    console.log("🔍 First item type:", typeof firstItem, Array.isArray(firstItem));
                    console.log("🔍 First item:", firstItem);

                    // If it's an array of segments
                    if (Array.isArray(firstItem)) {
                        const texts: string[] = [];
                        for (const seg of firstItem) {
                            if (Array.isArray(seg) && seg.length >= 3) {
                                texts.push(seg[2]); // [start, end, text]
                            } else if (typeof seg === 'string') {
                                texts.push(seg);
                            } else if (seg && typeof seg === 'object' && seg.text) {
                                texts.push(seg.text);
                            }
                        }
                        if (texts.length > 0) {
                            const result = texts.join(' ').trim();
                            console.log("✅ Extracted:", result);
                            return result;
                        }
                    }

                    // If it's a direct string
                    if (typeof firstItem === 'string') {
                        console.log("✅ Direct string:", firstItem);
                        return firstItem.trim();
                    }

                    // If it's an object with text
                    if (firstItem && typeof firstItem === 'object') {
                        if (firstItem.text) {
                            console.log("✅ Object.text:", firstItem.text);
                            return firstItem.text.trim();
                        }
                        // Maybe it's { data: [...] } structure
                        if (firstItem.data && Array.isArray(firstItem.data)) {
                            const texts = firstItem.data.map((row: any) =>
                                Array.isArray(row) && row.length >= 3 ? row[2] : ''
                            ).filter(Boolean);
                            if (texts.length > 0) {
                                const result = texts.join(' ').trim();
                                console.log("✅ From nested data:", result);
                                return result;
                            }
                        }
                    }
                }

                console.warn("⚠️ Could not parse, returning debug info");
                console.log("Full data:", JSON.stringify(data, null, 2));
            }

            return "";

        } catch (e: any) {
            console.error("❌ Transcription error:", e);
            throw e;
        }
    };

    // Process queue with concurrency
    const processQueue = async (links: string[]) => {
        let currentIndex = 0;
        const results: Record<string, string> = {};

        const processNext = async (): Promise<void> => {
            if (stopSignalRef.current || currentIndex >= links.length) return;

            const index = currentIndex++;
            const link = links[index];

            // Check cache
            if (cache[link]) {
                addLog(`[Cache] ${link}`, 'success');
                results[link] = cache[link];
                setProgress(prev => ({ ...prev, current: prev.current + 1 }));
                return processNext();
            }

            addLog(`Processing ${index + 1}/${links.length}: ${link}`, 'info');

            try {
                const text = await transcribeWithParakeet(link);
                if (text) {
                    addLog(`✅ "${text.substring(0, 50)}..."`, 'success');
                    results[link] = text;
                    setCache(prev => ({ ...prev, [link]: text }));
                } else {
                    addLog(`⚠️ Empty result: ${link}`, 'warning');
                    results[link] = link;
                }
            } catch (err: any) {
                addLog(`❌ Failed: ${err.message}`, 'error');
                results[link] = link;
            } finally {
                setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }

            return processNext();
        };

        // Start concurrent workers
        const workers = [];
        for (let i = 0; i < concurrency; i++) {
            workers.push(processNext());
        }

        await Promise.all(workers);
        return results;
    };

    const startBatchProcessing = async () => {
        if (isProcessing) return;
        if (!gradioClientRef.current) {
            addLog("⚠️ Gradio client not ready. Please wait...", 'warning');
            return;
        }

        setIsProcessing(true);
        stopSignalRef.current = false;
        setProcessedContent('');

        const links = [...inputContent.matchAll(AUDIO_REGEX)].map(m => m[0]);
        const uniqueLinks = [...new Set(links)];

        if (uniqueLinks.length === 0) {
            addLog("No audio links found in input.", 'warning');
            setIsProcessing(false);
            return;
        }

        addLog(`Found ${uniqueLinks.length} unique audio links.`, 'info');
        addLog(`Processing with ${concurrency} concurrent threads...`, 'info');
        setProgress({ current: 0, total: uniqueLinks.length });

        const results = await processQueue(uniqueLinks);

        // Replace in content
        let finalContent = inputContent;
        for (const [link, text] of Object.entries(results)) {
            finalContent = finalContent.split(link).join(text);
        }

        for (const [link, text] of Object.entries(cache)) {
            finalContent = finalContent.split(link).join(text);
        }

        setProcessedContent(finalContent);
        setIsProcessing(false);
        addLog("✅ Batch processing complete!", 'success');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setInputContent(event.target.result as string);
                addLog(`Loaded file: ${file.name}`, 'info');
            }
        };
        reader.readAsText(file);
    };

    const downloadResult = () => {
        const blob = new Blob([processedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question_processed.inp';
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearCache = () => {
        setCache({});
        localStorage.removeItem('ioe_transcribe_cache_parakeet');
        addLog("Cache cleared!", 'info');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600 p-6 font-sans text-white">
            <div className="max-w-5xl mx-auto bg-white/95 text-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">

                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600">
                                🚀 IOE Parakeet V3 Transcriber
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">NVIDIA Parakeet TDT 0.6B • Gradio API • No Key • Ultra Fast</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold ${gradioClientRef.current ? 'text-green-600' : 'text-orange-500'}`}>
                                {gradioClientRef.current ? '✅ API Connected' : '⏳ Connecting...'}
                            </div>
                            <div className="text-[10px] text-gray-400">Parakeet TDT 0.6B V3</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Settings & Input */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-green-800 mb-3">⚙️ Settings</h3>

                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Concurrency (Max: 5)</label>
                                <input
                                    type="range" min="1" max="5"
                                    value={concurrency}
                                    onChange={(e) => setConcurrency(parseInt(e.target.value))}
                                    className="w-full accent-teal-600"
                                />
                                <div className="text-right text-xs text-gray-600 font-bold">{concurrency} threads</div>
                            </div>

                            <div className="text-[10px] text-gray-500 space-y-1">
                                <p>✅ No API key required</p>
                                <p>✅ NVIDIA Parakeet TDT model</p>
                                <p>⚡ Gradio Space (FREE)</p>
                                <p>🎯 High accuracy for English</p>
                                <p>🔧 Debug in browser console (F12)</p>
                            </div>

                            <button
                                onClick={clearCache}
                                className="mt-3 w-full text-xs bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium transition-colors"
                            >
                                🗑️ Clear Cache ({Object.keys(cache).length} items)
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-teal-300 rounded-lg p-4 text-center hover:bg-teal-50 transition-colors">
                            <input
                                type="file"
                                accept=".inp,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="fileInput"
                            />
                            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-2">
                                <span className="text-4xl">📂</span>
                                <span className="text-sm font-semibold text-teal-700">Upload question.inp</span>
                                <span className="text-[10px] text-gray-500">Or paste below</span>
                            </label>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-4 flex flex-col">
                        <textarea
                            className="w-full h-40 p-3 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-xs"
                            placeholder="Paste content with audio links (http://...mp3 or .wav)..."
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                        />

                        {/* Progress */}
                        <div className="bg-gray-200 rounded-full h-5 overflow-hidden relative shadow-inner">
                            <div
                                className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 h-full transition-all duration-300"
                                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                                {progress.current} / {progress.total} ({progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%)
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto font-mono text-xs h-52 shadow-lg">
                            {logs.length === 0 && (
                                <div className="text-gray-500 italic">🚀 Ready! Open browser console (F12) for detailed logs.</div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                            log.type === 'warning' ? 'text-yellow-400' : 'text-cyan-300'
                                    }`}>
                                    <span className="opacity-60">[{log.time}]</span> {log.message}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {!isProcessing ? (
                                <button
                                    onClick={startBatchProcessing}
                                    disabled={!inputContent || !gradioClientRef.current}
                                    className="flex-1 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:via-teal-700 hover:to-cyan-700 text-white py-3 px-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <span>🚀 START PARAKEET V3</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        stopSignalRef.current = true;
                                        setIsProcessing(false);
                                        addLog("Stopped by user", 'warning');
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg"
                                >
                                    🛑 STOP
                                </button>
                            )}

                            <button
                                onClick={downloadResult}
                                disabled={!processedContent}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                <span>💾 DOWNLOAD</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-[10px] text-gray-500">
                        Powered by NVIDIA Parakeet TDT V3 via Gradio • Free • Up to {concurrency}x parallel • Check console for debug info
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
