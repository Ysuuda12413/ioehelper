(function () {
    'use strict';

    // Allow user to override API URL via window.IOE_API_URL
    // Default to the deployed URL.
    const API_URL = window.IOE_API_URL || 'https://duyundz.is-a.dev/ioehelper/';

    // Create hidden iframe for Whisper API
    let whisperFrame = null;
    let apiReady = false;
    let requestId = 0;
    const pendingRequests = new Map();

    function initWhisperAPI() {
        if (whisperFrame) return;

        whisperFrame = document.createElement('iframe');
        whisperFrame.src = API_URL;
        whisperFrame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
        whisperFrame.id = 'ioe-whisper-frame';
        document.body.appendChild(whisperFrame);

        window.addEventListener('message', (event) => {
            if (event.data.type === 'IOE_READY') {
                apiReady = true;
                console.log('%c✅ Whisper API Connected!', 'color:#0f0;font-weight:bold');
            } else if (event.data.type === 'TRANSCRIBE_RESPONSE') {
                const request = pendingRequests.get(event.data.requestId);
                if (request) {
                    if (event.data.success) {
                        request.resolve(event.data.text);
                    } else {
                        request.reject(new Error(event.data.error));
                    }
                    pendingRequests.delete(event.data.requestId);
                }
            }
        });

        console.log('%c⏳ Connecting to Whisper API...', 'color:#fa0;font-weight:bold');
    }

    async function transcribeAudio(audioUrl) {
        if (!whisperFrame) {
            initWhisperAPI();
            // Wait a bit for iframe to load if just created
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if (!apiReady) {
            // Try waiting a bit more
            console.log('Waiting for API ready...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (!apiReady) {
                throw new Error('Whisper API not ready yet. Please check connection.');
            }
        }

        return new Promise((resolve, reject) => {
            const id = ++requestId;
            pendingRequests.set(id, { resolve, reject });

            whisperFrame.contentWindow.postMessage({
                type: 'TRANSCRIBE_REQUEST',
                requestId: id,
                audioUrl: audioUrl
            }, '*');

            // Timeout after 300s
            setTimeout(() => {
                if (pendingRequests.has(id)) {
                    pendingRequests.delete(id);
                    reject(new Error('Transcription timeout (300s)'));
                }
            }, 300000);
        });
    }

    // Intercept XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    let gameData = null;
    let gameAns = null;
    let audioFiles = [];

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._url = url;
        return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('readystatechange', function () {
            if (this.readyState === 4 && this.status === 200 && this._url && this._url.toLowerCase().includes('getinfo')) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response?.data?.game?.question) {
                        gameData = response.data.game;
                        gameAns = response.data.game.ans || [];
                        audioFiles = [];

                        const hasAns = gameAns && gameAns.length > 0;

                        console.clear();
                        console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color:#0ff;font-weight:bold');
                        console.log('%c║        📚 IOE Helper v7 - Auto Whisper API              ║', 'color:#0ff;font-weight:bold;font-size:16px');
                        console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color:#0ff;font-weight:bold');

                        const questionType = gameData.question[0]?.type || 0;
                        let typeName = 'Unknown';
                        if (questionType === 1) typeName = 'TRUE/FALSE';
                        else if (questionType === 2) typeName = 'FILL IN BLANK';
                        else if (questionType === 3) typeName = 'SENTENCE REWRITE';
                        else if (questionType === 4) typeName = 'LISTENING';

                        console.log(`%c📊 Loại: ${typeName} | Tổng: ${gameData.question.length} câu | ⏱️ ${Math.floor(gameData.examTime / 60)}p`,
                            hasAns ? 'color:#0f0;font-size:14px;font-weight:bold' : 'color:#fa0;font-size:14px;font-weight:bold');
                        console.log('%c' + '═'.repeat(70), 'color:#0ff');

                        // Process questions
                        gameData.question.forEach((q, idx) => {
                            const qType = q.type || 0;
                            const answers = (q.ans || q.tans || q.tansDB || [])
                                .slice()
                                .sort((a, b) => (a.orderTrue ?? 999) - (b.orderTrue ?? 999));

                            let question = '';
                            let answer = '';
                            let passage = '';

                            if (qType === 1) {
                                passage = q.Description?.content || '';
                                question = q.content?.content || 'N/A';
                                if (answers.length > 0 && answers[0].content) {
                                    answer = answers.map(a => a.content).join(' / ');
                                } else if (hasAns && gameAns[idx]?.ans) {
                                    answer = gameAns[idx].ans;
                                } else {
                                    answer = 'TRUE hoặc FALSE';
                                }
                            } else if (qType === 2 || qType === 3) {
                                passage = q.Description?.content || '';
                                question = q.content?.content || q.Description?.content || 'N/A';
                                if (answers.length > 0 && answers[0].content) {
                                    answer = answers.map(a => a.content).join(' / ');
                                } else if (hasAns && gameAns[idx]?.ans) {
                                    answer = gameAns[idx].ans;
                                }
                            } else if (qType === 4) {
                                passage = q.Description?.content || '';
                                question = '🎧 LISTENING';
                                if (q.Description?.content) {
                                    const audioMatches = q.Description.content.match(/https?:\/\/[^\s"'<>]+\.(mp3|wav|ogg)/gi);
                                    if (audioMatches) {
                                        audioFiles.push({
                                            questionNum: idx + 1,
                                            audioUrl: audioMatches[0],
                                            description: passage
                                        });
                                    }
                                }
                                if (answers.length > 0 && answers[0].content) {
                                    answer = answers.map(a => a.content).join(' / ');
                                } else if (hasAns && gameAns[idx]?.ans) {
                                    answer = gameAns[idx].ans;
                                } else {
                                    answer = 'Gõ: transcribe(' + (idx + 1) + ')';
                                }
                            }

                            console.log(`%c┌─── CÂU ${idx + 1} ${qType === 4 ? '🎧' : ''}───────────────────────────┐`, 'color:#ff0;font-weight:bold');

                            if (passage && qType !== 4) {
                                console.log(`%c│ 📖 ${passage.substring(0, 60)}...`, 'color:#ccc;font-size:12px');
                            }

                            console.log(`%c│ 📝 ${question}`, 'color:#fff;font-size:13px;font-weight:bold');

                            if (answer) {
                                console.log(`%c│ ✅ ${answer}`, 'color:#0f0;font-weight:bold;font-size:14px;background:#030;padding:2px');
                            } else {
                                console.log(`%c│ ⚠️  Chưa có đáp án`, 'color:#f00;font-weight:bold');
                            }

                            console.log(`%c└${'─'.repeat(60)}┘`, 'color:#ff0');
                        });

                        if (audioFiles.length > 0) {
                            console.log('');
                            console.log('%c🎧 LISTENING QUESTIONS:', 'color:#f0f;font-weight:bold;font-size:14px');
                            audioFiles.forEach(af => {
                                console.log(`%c  Câu ${af.questionNum}: transcribe(${af.questionNum})`, 'color:#f0f;font-size:12px;font-weight:bold');
                            });
                            console.log('');

                            // Auto-initialize Whisper API
                            initWhisperAPI();
                        }

                        console.log('%c' + '═'.repeat(70), 'color:#0ff');
                        console.log('%c✅ Sẵn sàng! Gõ: showAll() | transcribe(số)', 'color:#0f0;font-weight:bold;font-size:14px');

                        // Store globally
                        window.ioeData = gameData;
                        window.ioeAudioFiles = audioFiles;

                        // Helper functions
                        window.showAll = () => {
                            console.log('%c╔═══ TẤT CẢ ĐÁP ÁN ═══╗', 'color:#0ff;font-weight:bold;font-size:14px');
                            gameData.question.forEach((q, idx) => {
                                const answers = (q.ans || q.tans || q.tansDB || []).sort((a, b) => (a.orderTrue ?? 999) - (b.orderTrue ?? 999));
                                let answer = '';
                                if (answers.length > 0 && answers[0].content) {
                                    answer = answers.map(a => a.content).join(' / ');
                                } else if (hasAns && gameAns[idx]?.ans) {
                                    answer = gameAns[idx].ans;
                                }
                                const qType = q.type || 0;
                                console.log(`%cCâu ${idx + 1}: ${qType === 4 ? '🎧 ' : ''}${answer || 'transcribe(' + (idx + 1) + ')'}`,
                                    answer ? 'color:#0f0;font-weight:bold' : 'color:#fa0');
                            });
                        };

                        window.playAudio = (num) => {
                            const audio = audioFiles.find(a => a.questionNum === num);
                            if (!audio) return console.error(`❌ Câu ${num} không có audio!`);
                            console.log(`%c🎧 Phát câu ${num}...`, 'color:#f0f;font-weight:bold');
                            new Audio(audio.audioUrl).play();
                        };

                        window.transcribe = async (num) => {
                            const audio = audioFiles.find(a => a.questionNum === num);
                            if (!audio) return console.error(`❌ Câu ${num} không có audio!`);

                            console.log(`%c🎧 Đang nhận diện câu ${num}...`, 'color:#fa0;font-weight:bold;font-size:14px');
                            console.log(`%c🔗 Link MP3: ${audio.audioUrl}`, 'color:#569cd6;text-decoration:underline;font-size:12px');

                            try {
                                const text = await transcribeAudio(audio.audioUrl);
                                console.log(`%c✅ KẾT QUẢ CÂU ${num}:`, 'color:#0f0;font-weight:bold;font-size:16px');
                                console.log(`%c"${text}"`, 'color:#fff;font-size:14px;background:#030;padding:8px;border-radius:4px;display:block;margin-top:5px');
                                return text;
                            } catch (error) {
                                console.error(`%c❌ Lỗi: ${error.message}`, 'color:#f00;font-weight:bold');
                                throw error;
                            }
                        };

                        console.log('%c💡 Lệnh: showAll() | playAudio(số) | transcribe(số)', 'color:#aaa;font-size:11px');
                    }
                } catch (error) {
                    console.error('❌ Parse error:', error);
                }
            }
        });

        return originalSend.apply(this, args);
    };

    console.log('%c🚀 IOE Script v7 - Auto Whisper API', 'color:#0f0;font-weight:bold;font-size:14px');
    console.log('%c📡 API sẽ tự động load ngay bây giờ để sẵn sàng...', 'color:#aaa;font-size:11px');

    // Preload API immediately
    initWhisperAPI();
})();