/**
 * WAV 文件合成器
 *
 * 纯数学生成正弦波 WAV 音频 → 无需外部音频文件。
 * 支持自定义频率、振幅、音量包络，生成自然听感的提示音。
 */

export interface ToneOptions {
  frequency: number // Hz
  duration: number // 秒
  volume?: number // 0-1，默认 0.5
  sampleRate?: number // 默认 44100
}

/**
 * 生成单个正弦波音调的 WAV Buffer
 */
export function generateTone(options: ToneOptions): Buffer {
  const { frequency, duration, volume = 0.5, sampleRate = 44100 } = options
  const numSamples = Math.floor(sampleRate * duration)
  const dataSize = numSamples * 2 // 16-bit = 2 bytes per sample
  const fileSize = 44 + dataSize

  const buffer = Buffer.alloc(fileSize)

  // ─── WAV Header (44 bytes) ──────────────
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(fileSize - 8, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // PCM chunk size
  buffer.writeUInt16LE(1, 20) // PCM format
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buffer.writeUInt16LE(2, 32) // block align
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // ─── PCM Samples ───────────────────────
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const normalizedT = i / numSamples

    // 淡入淡出（各 5%），避免咔嗒声
    let envelope = 1
    if (normalizedT < 0.05) {
      envelope = normalizedT / 0.05
    } else if (normalizedT > 0.95) {
      envelope = (1 - normalizedT) / 0.05
    }

    // 正弦波
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)))
    buffer.writeInt16LE(intSample, 44 + i * 2)
  }

  return buffer
}

/**
 * 生成多音调序列的 WAV Buffer（音符依次播放）
 */
export function generateMelody(
  notes: Array<{ frequency: number; duration: number }>,
  volume: number = 0.5
): Buffer {
  const sampleRate = 44100
  const allSamples: number[] = []

  for (const note of notes) {
    const numSamples = Math.floor(sampleRate * note.duration)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      const normalizedT = i / numSamples
      let envelope = 1
      if (normalizedT < 0.05) envelope = normalizedT / 0.05
      else if (normalizedT > 0.95) envelope = (1 - normalizedT) / 0.05

      const sample = Math.sin(2 * Math.PI * note.frequency * t) * volume * envelope
      allSamples.push(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))))
    }
  }

  const dataSize = allSamples.length * 2
  const fileSize = 44 + dataSize
  const buffer = Buffer.alloc(fileSize)

  // Header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(fileSize - 8, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // Samples
  for (let i = 0; i < allSamples.length; i++) {
    buffer.writeInt16LE(allSamples[i], 44 + i * 2)
  }

  return buffer
}
