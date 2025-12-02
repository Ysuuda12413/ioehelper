# 🔖 IOE Helper Bookmarklet

## Cách sử dụng nhanh với Bookmarklet

### Bước 1: Tạo Bookmarklet

1. Tạo một bookmark mới trong trình duyệt
2. Đặt tên: `IOE Helper`
3. URL: Copy đoạn code dưới đây

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://duyundz.is-a.dev/ioehelper/ioe.js';document.body.appendChild(s);setTimeout(function(){window.open('https://duyundz.is-a.dev/ioehelper','_blank');},1000);})();
```

### Bước 2: Sử dụng

1. Vào trang làm bài thi IOE
2. Click vào bookmark "IOE Helper"
3. Script sẽ tự động:
   - Inject vào trang IOE
   - Mở tab Whisper mới
4. Làm bài như bình thường, khi gặp câu listening gõ: `transcribe(1)`

## 📋 Manual Injection (Không dùng Bookmarklet)

### Bước 1: Mở trang Whisper

Mở trong tab mới:

```
https://duyundz.is-a.dev/ioehelper
```

### Bước 2: Inject script vào trang IOE

Trên trang IOE, mở Console (F12) và paste:

```javascript
// Inject IOE Helper Script v6
(function(){const o=XMLHttpRequest.prototype.open,n=XMLHttpRequest.prototype.send;let t=null,e=null,s=[];XMLHttpRequest.prototype.open=function(n,t,...e){return this._u=t,o.apply(this,[n,t,...e])};XMLHttpRequest.prototype.send=function(...o){return this.addEventListener("readystatechange",function(){if(4===this.readyState&&200===this.status&&this._u&&this._u.toLowerCase().includes("getinfo"))try{const o=JSON.parse(this.responseText);if(o?.data?.game?.question){t=o.data.game,e=o.data.game.ans||[],s=[];const n=e&&e.length>0;console.clear(),console.log("%c╔═══════════════════════════════════════════════════════════╗","color:#0ff;font-weight:bold"),console.log("%c║        📚 IOE - ĐÁP ÁN BÀI THI (v6 - Local Whisper)       ║","color:#0ff;font-weight:bold;font-size:16px"),console.log("%c╚═══════════════════════════════════════════════════════════╝","color:#0ff;font-weight:bold");const a=t.question[0]?.type||0;let c="Unknown";1===a?c="TRUE/FALSE":2===a?c="FILL IN BLANK":3===a?c="SENTENCE REWRITE":4===a&&(c="LISTENING"),console.log(`%c📊 Loại: ${c} | Tổng: ${t.question.length} câu | ⏱️ ${Math.floor(t.examTime/60)}p`,n?"color:#0f0;font-size:14px;font-weight:bold":"color:#fa0;font-size:14px;font-weight:bold"),console.log("%c"+("═".repeat(70)),"color:#0ff"),t.question.forEach((o,a)=>{const c=o.type||0,l=(o.ans||o.tans||o.tansDB||[]).slice().sort((o,n)=>(o.orderTrue??999)-(n.orderTrue??999));let r="",i="",u="";if(1===c)u=o.Description?.content||"",r=o.content?.content||"N/A",l.length>0&&l[0].content?i=l.map(o=>o.content).join(" / "):n&&e[a]?.ans?i=e[a].ans:i="TRUE hoặc FALSE";else if(2===c||3===c){if(u=o.Description?.content||"",r=o.content?.content||o.Description?.content||"N/A",l.length>0&&l[0].content)i=l.map(o=>o.content).join(" / ");else if(n&&e[a]?.ans)i=e[a].ans;else{const n=o.content?.content||"";if(n.includes("*")){const o=n.match(/\*+/g);o&&(i=`[${o[0].length} ký tự]`)}}}else if(4===c){if(u=o.Description?.content||"",r="🎧 Câu hỏi LISTENING",o.Description?.content){const n=o.Description.content.match(/https?:\/\/[^\s"'<>]+\.(mp3|wav|ogg)/gi);n&&(s.push({questionNum:a+1,audioUrl:n[0],description:u}),r+=" - 🔗 Audio")}l.length>0&&l[0].content?i=l.map(o=>o.content).join(" / "):n&&e[a]?.ans?i=e[a].ans:i="Cần nghe audio"}console.log(`%c┌─── CÂU ${a+1} ${1===c?"[TRUE/FALSE]":2===c?"[ĐIỀN CHỖ TRỐNG]":3===c?"[VIẾT LẠI CÂU]":4===c?"[LISTENING]":""}───────────────────────────┐`,"color:#ff0;font-weight:bold"),u&&(console.log("%c│ 📖 ĐOẠN VĂN:","color:#aaf;font-weight:bold;font-size:13px"),u.split(". ").forEach(o=>{o.trim()&&console.log(`%c│    ${o.trim()}.`,"color:#ccc;font-size:12px")}),console.log("%c│","color:#ff0")),console.log(`%c│ 📝 CÂU HỎI: ${r}`,"color:#fff;font-size:13px;font-weight:bold"),i?console.log(`%c│ ✅ ĐÁP ÁN: ${i}`,"color:#0f0;font-weight:bold;font-size:14px;background:#030;padding:2px"):console.log("%c│ ⚠️  Chưa có đáp án","color:#f00;font-weight:bold"),console.log(`%c└${"─".repeat(60)}┘`,"color:#ff0")}),s.length>0&&(console.log(""),console.log("%c🎧 ═══ AUDIO FILES ═══","color:#f0f;font-weight:bold;font-size:14px"),s.forEach(o=>{console.log(`%c📁 Câu ${o.questionNum}: ${o.audioUrl}`,"color:#f0f;font-size:12px")}),console.log(""),console.log("%c💡 Gõ playAudio(số) để phát | transcribe(số) để nhận diện với Whisper Local","color:#aaa;font-size:11px")),console.log("%c"+("═".repeat(70)),"color:#0ff"),console.log("%c✅ HOÀN TẤT! Gõ showAll() để xem lại","color:#0f0;font-weight:bold;font-size:14px"),window.ioeData=t,window.ioeGameAns=e,window.ioeAudioFiles=s,window.ioeAns=t.question.map((o,a)=>{const c=(o.ans||o.tans||o.tansDB||[]).sort((o,n)=>(o.orderTrue??999)-(n.orderTrue??999));let l="";if(c.length>0&&c[0].content)l=c.map(o=>o.content).join(" / ");else if(n&&e[a]?.ans)l=e[a].ans;else{const n=o.content?.content||"";if(n.includes("*")){const o=n.match(/\*+/g);o&&(l=`[cần ${o[0].length} ký tự]`)}}const r=o.type||0;let i="";if(4===r&&o.Description?.content){const n=o.Description.content.match(/https?:\/\/[^\s"'<>]+\.(mp3|wav|ogg)/gi);n&&(i=n[0])}return{n:a+1,type:r,q:o.content?.content||"",passage:o.Description?.content||"",a:l,numChar:o.numTChar||0,audioUrl:i}}),window.show=o=>{const n=window.ioeAns[o-1];if(!n)return console.error(`❌ Câu ${o} không tồn tại!`);console.log(`%c┌─── CÂU ${n.n} ${1===n.type?"[TRUE/FALSE]":2===n.type?"[ĐIỀN CHỖ TRỐNG]":3===n.type?"[VIẾT LẠI CÂU]":4===n.type?"[LISTENING]":""}───────────────┐`,"color:#ff0;font-weight:bold"),n.passage&&(console.log("%c│ 📖 ĐOẠN VĂN:","color:#aaf;font-weight:bold"),n.passage.split(". ").forEach(o=>{o.trim()&&console.log(`%c│    ${o.trim()}.`,"color:#ccc;font-size:12px")}),console.log("%c│","color:#ff0")),console.log(`%c│ 📝 ${n.q}`,"color:#fff;font-size:13px;font-weight:bold"),n.audioUrl&&console.log(`%c│ 🎧 Audio: ${n.audioUrl}`,"color:#f0f;font-size:12px"),n.a?console.log(`%c│ ✅ ĐÁP ÁN: ${n.a}`,"color:#0f0;font-weight:bold;font-size:14px;background:#030;padding:2px"):console.log("%c│ ⚠️  Chưa có đáp án","color:#f00;font-weight:bold"),console.log(`%c└${"─".repeat(60)}┘`,"color:#ff0")},window.showAll=()=>{console.log("%c╔═══════════════════════════════════════════════════════════╗","color:#0ff;font-weight:bold"),console.log("%c║        📋 TẤT CẢ ĐÁP ÁN                                  ║","color:#0ff;font-weight:bold;font-size:16px"),console.log("%c╚═══════════════════════════════════════════════════════════╝","color:#0ff;font-weight:bold"),window.ioeAns.forEach(o=>{console.log(`%c━━━ Câu ${o.n} ${1===o.type?"[T/F]":2===o.type?"[FILL]":3===o.type?"[REWRITE]":4===o.type?"[AUDIO]":""}━━━`,"color:#ff0;font-weight:bold"),o.passage&&console.log(`📖 ${o.passage.substring(0,100)}...`),console.log(`📝 ${o.q.substring(0,80)}${o.q.length>80?"...":""}`),o.audioUrl&&console.log(`🎧 ${o.audioUrl}`),o.a?console.log(`%c✅ ${o.a}`,"color:#0f0;font-weight:bold;font-size:13px;background:#030;padding:2px"):console.log("%c⚠️ Chưa có","color:#f00")})},window.copyAns=()=>{const o=window.ioeAns.map(o=>`Câu ${o.n}: ${o.a||"?"}`).join("\n");navigator.clipboard.writeText(o).then(()=>console.log("%c✅ Đã copy đáp án!","color:#0f0;font-weight:bold"))},window.playAudio=o=>{const n=window.ioeAudioFiles.find(n=>n.questionNum===o);if(!n)return console.error(`❌ Câu ${o} không có audio!`);console.log(`%c🎧 Phát audio câu ${o}...`,"color:#f0f;font-weight:bold");const t=new Audio(n.audioUrl);t.play(),console.log(`%c📁 ${n.audioUrl}`,"color:#aaa")},window.transcribe=async o=>{const n=window.ioeAudioFiles.find(n=>n.questionNum===o);if(!n)return console.error(`❌ Câu ${o} không có audio!`);console.log(`%c⏳ Đang transcribe câu ${o} với Whisper Tiny Local...`,"color:#fa0;font-weight:bold"),console.log(`%c📡 Sử dụng: ${window.location.origin}/ioehelper`,"color:#aaa");try{if("function"!=typeof window.IOETranscribe)return console.error("%c❌ Chưa load trang Whisper! Mở tab mới:","color:#f00;font-weight:bold"),console.log("%c🔗 https://duyundz.is-a.dev/ioehelper","color:#0ff;font-size:14px"),void console.log("%c💡 Sau khi mở trang đó, quay lại đây và gõ lại transcribe(${o})","color:#aaa");const t=await window.IOETranscribe(n.audioUrl);t?(console.log("%c✅ TRANSCRIPT:","color:#0f0;font-weight:bold;font-size:14px"),console.log(`%c"${t}"`,"color:#fff;font-size:13px;background:#030;padding:5px"),window.ioeAns[o-1]&&(window.ioeAns[o-1].transcript=t)):console.error("⚠️ Không nhận được transcript")}catch(o){console.error("❌ Lỗi transcribe:",o),console.log("%c💡 Hãy mở trang Whisper trong tab mới và thử lại","color:#aaa"),console.log("%c🔗 https://duyundz.is-a.dev/ioehelper","color:#0ff")}},window.listAudio=()=>{window.ioeAudioFiles.length>0?(console.log("%c🎧 ═══ DANH SÁCH AUDIO ═══","color:#f0f;font-weight:bold"),window.ioeAudioFiles.forEach(o=>{console.log(`Câu ${o.questionNum}: %c${o.audioUrl}`,"color:#f0f")})):console.log("%c⚠️ Không có câu hỏi listening","color:#fa0")},console.log("%c💡 Lệnh: show(số) | showAll() | copyAns() | playAudio(số) | transcribe(số) | listAudio()","color:#aaa;font-size:11px")}}catch(o){console.error("❌ Parse error:",o)}}),n.apply(this,o)},console.log("%c🚀 IOE Script v6 - Whisper Local Integration","color:#0ff;font-weight:bold;font-size:14px"),console.log("%c💡 Mở trang Whisper: https://duyundz.is-a.dev/ioehelper","color:#aaa")})();
```

### Bước 3: Làm bài

Các lệnh có sẵn:

```javascript
show(1)           // Xem câu 1
showAll()         // Xem tất cả câu
copyAns()         // Copy tất cả đáp án

playAudio(1)      // Phát audio câu 1
listAudio()       // Liệt kê tất cả audio

transcribe(1)     // Nhận diện giọng nói câu 1 (cần mở tab Whisper)
```

## 🎯 Tips

1. **Mở trang Whisper TRƯỚC** khi gõ `transcribe()`
2. Model Whisper Tiny (~40MB) sẽ download lần đầu, lần sau dùng cache
3. Transcribe có thể mất 5-15 giây tùy độ dài audio
4. Nếu lỗi CORS, thử download audio và upload lên nơi khác

## 🔗 Quick Links

- **Whisper App**: <https://duyundz.is-a.dev/ioehelper>
- **IOE Website**: <https://ioe.vn>
- **Full README**: README-DEPLOY.md
