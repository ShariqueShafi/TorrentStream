import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Live-transcode a readable stream into HLS segments.
 *
 * Unlike the old transcoder that waited for a full file on disk,
 * this pipes the torrent's createReadStream() directly into FFmpeg stdin.
 *
 * FFmpeg settings:
 *   -hls_time 4           → 4-second segments (fast start)
 *   -hls_list_size 0      → keep all segments in playlist (seekable VOD-style)
 *   -hls_flags delete_segments+append_list → auto-delete old segments once playlist moves past them
 *   -c:v copy              → no video re-encode (fast)
 *   -c:a aac               → transcode audio to AAC for browser compatibility
 *
 * @param {ReadableStream} inputStream - WebTorrent file.createReadStream()
 * @param {string} outputDir - e.g. /tmp/torrentstream/hls/<jobId>
 * @param {function} onProgress - called with progress info
 * @returns {Promise<string>} - resolves with path to index.m3u8
 */
export function liveTranscode(inputStream, outputDir, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, 'index.m3u8');
    const segmentPattern = path.join(outputDir, 'seg%04d.ts');

    const args = [
      '-i', 'pipe:0',                    // Read from stdin
      '-c:v', 'copy',                    // Copy video codec (no re-encode)
      '-c:a', 'aac',                     // Transcode audio to AAC
      '-b:a', '128k',                    // Audio bitrate
      '-f', 'hls',                       // Output format: HLS
      '-hls_time', '4',                  // 4-second segments
      '-hls_list_size', '0',             // Keep all segments in playlist
      '-hls_playlist_type', 'event',     // Seekable growing playlist, adds ENDLIST when done
      '-hls_segment_filename', segmentPattern,
      '-y',                              // Overwrite output files
      playlistPath
    ];

    const ffmpeg = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']    // stdin, stdout, stderr all piped
    });

    let started = false;
    let stderrOutput = '';
    let totalDurationSec = null;
    let currentTimeSec = 0;

    // Pipe torrent stream into FFmpeg stdin
    inputStream.pipe(ffmpeg.stdin);

    // Handle input stream errors gracefully
    inputStream.on('error', (err) => {
      console.error('[LiveTranscoder] Input stream error:', err.message);
      ffmpeg.stdin.end();
    });

    // FFmpeg writes progress to stderr
    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();
      stderrOutput += line;

      // Parse total duration from input metadata (e.g. "Duration: 00:45:23.45")
      if (!totalDurationSec) {
        const durMatch = line.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (durMatch) {
          totalDurationSec = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3]);
          onProgress({ event: 'duration', totalDurationSec });
        }
      }

      // Check if the playlist file exists yet → means first segment is ready
      if (!started && fs.existsSync(playlistPath)) {
        started = true;
        onProgress({ event: 'playlist_ready', path: playlistPath });
      }

      // Parse current transcode progress (e.g. "time=00:01:23.45")
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        currentTimeSec = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
        const percent = totalDurationSec ? Math.min(Math.round((currentTimeSec / totalDurationSec) * 100), 99) : 0;
        onProgress({ event: 'progress', currentTimeSec, totalDurationSec, percent });
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('[LiveTranscoder] Transcode complete:', playlistPath);
        resolve(playlistPath);
      } else {
        const errorLines = stderrOutput.split('\n').slice(-5).join('\n');
        console.error(`[LiveTranscoder] FFmpeg exited with code ${code}`);
        reject(new Error(`FFmpeg exited with code ${code}: ${errorLines}`));
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('[LiveTranscoder] FFmpeg spawn error:', err.message);
      reject(err);
    });

    // If ffmpeg stdin errors (e.g. broken pipe), don't crash
    ffmpeg.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE') {
        console.error('[LiveTranscoder] FFmpeg stdin error:', err.message);
      }
    });
  });
}

/**
 * Check if the HLS playlist is ready for playback.
 * We consider it ready once index.m3u8 exists and has at least one segment.
 */
export function isPlaylistReady(outputDir) {
  const playlistPath = path.join(outputDir, 'index.m3u8');
  if (!fs.existsSync(playlistPath)) return false;

  const content = fs.readFileSync(playlistPath, 'utf-8');
  return content.includes('.ts');
}
