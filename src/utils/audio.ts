export async function decodeAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 16000 }); // Force 16kHz
    return await audioContext.decodeAudioData(arrayBuffer);
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
    // Force Mono (1 channel) for Google Speech API compatibility and smaller size
    const numOfChan = 1;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // Mix down to mono if necessary
    let monoData: Float32Array;
    if (buffer.numberOfChannels === 1) {
        monoData = buffer.getChannelData(0);
    } else {
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        monoData = new Float32Array(left.length);
        for (let j = 0; j < left.length; j++) {
            monoData[j] = (left[j] + right[j]) / 2;
        }
    }

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(16000); // sampleRate (Force 16000)
    setUint32(16000 * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write data
    while (pos < buffer.length) {
        sample = Math.max(-1, Math.min(1, monoData[pos])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(44 + offset, sample, true); // write 16-bit sample
        offset += 2;
        pos++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
