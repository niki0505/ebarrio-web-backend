import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ffmpeg.setFfmpegPath(
//   "C:/Users/Charito/FFmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe"
// );

const RTSP_URL =
  "rtsp://rtspstream:kuSUMpTyTMZ1oXl-ZMopw@zephyr.rtsp.stream/people";
const SNAPSHOT_DIR = path.join(__dirname, "..", "snapshots");

// Ensure folder exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR);
}

export async function captureSnapshot(req, res) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFile = path.join(SNAPSHOT_DIR, `snapshot-${timestamp}.jpg`);

  console.log(`[${new Date().toLocaleTimeString()}] Capturing snapshot...`);

  ffmpeg(RTSP_URL)
    .inputOptions(["-rtsp_transport", "tcp", "-ss", "2"])
    .frames(1)
    .output(outputFile)
    .on("start", (cmd) => console.log("📸 Starting:", cmd))
    .on("stderr", (line) => console.log("🪵", line))
    .on("end", () => {
      console.log(`✅ Snapshot saved: ${outputFile}`);
      res?.status(200).json({ message: "Snapshot captured", file: outputFile });
    })
    .on("error", (err) => {
      console.error(`❌ Snapshot failed: ${err.message}`);
      res?.status(500).json({ error: "Snapshot failed", details: err.message });
    })
    .run();
}
