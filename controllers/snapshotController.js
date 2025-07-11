import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { bucket } from "../firebaseAdmin.js";

export async function getLatestSnapshot(req, res) {
  try {
    const [files] = await bucket.getFiles({ prefix: "snapshots/" });

    const snapshots = files
      .filter((file) => file.name.endsWith(".jpg"))
      .sort((a, b) => a.name.localeCompare(b.name));

    const latest = snapshots.at(-1);

    if (!latest) {
      return res.status(404).json({ error: "No snapshots found" });
    }

    await latest.makePublic();

    const latestFilename = latest.name.split("/").pop();
    let latestDatetime = "Unknown";

    const latestMatch = latestFilename.match(
      /snapshot-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/
    );

    if (latestMatch) {
      const [_, year, month, day, hour, minute, second] = latestMatch;
      const utcDate = new Date(
        Date.UTC(year, month - 1, day, hour, minute, second)
      );

      latestDatetime = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(utcDate);
    }

    // Get last 6 before the latest
    const recentHistory = snapshots.slice(-7, -1).reverse();

    const historyData = await Promise.all(
      recentHistory.map(async (file) => {
        await file.makePublic();
        const filename = file.name.split("/").pop(); // e.g., snapshot_20250709_135500.jpg

        const match = filename.match(
          /snapshot-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/
        );
        let datetime = "Unknown";

        if (match) {
          const [_, year, month, day, hour, minute, second] = match;
          const utcDate = new Date(
            Date.UTC(year, month - 1, day, hour, minute, second)
          );
          datetime = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).format(utcDate);
        }

        return {
          url: file.publicUrl(),
          name: filename,
          datetime,
        };
      })
    );

    console.log(historyData);
    return res.status(200).json({
      latest: { url: latest.publicUrl(), datetime: latestDatetime },
      history: historyData,
    });
  } catch (err) {
    console.error("❌ Failed to get latest snapshot:", err);
    res
      .status(500)
      .json({ error: "Failed to get snapshot", details: err.message });
  }
}

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
    .on("end", async () => {
      console.log(`✅ Snapshot saved: ${outputFile}`);

      const firebaseFilename = `snapshots/snapshot-${timestamp}.jpg`;

      try {
        await bucket.upload(outputFile, {
          destination: firebaseFilename,
          metadata: { contentType: "image/jpeg" },
        });

        await bucket.file(firebaseFilename).makePublic();
        const publicUrl = bucket.file(firebaseFilename).publicUrl();

        console.log(`📤 Uploaded to Firebase: ${publicUrl}`);

        res?.status(200).json({ message: "Snapshot captured", url: publicUrl });
      } catch (err) {
        console.error("❌ Firebase upload failed:", err);
        res?.status(500).json({ error: "Upload failed", details: err.message });
      } finally {
        fs.unlinkSync(outputFile);
      }
    })
    .on("error", (err) => {
      console.error(`❌ Snapshot failed: ${err.message}`);
      res?.status(500).json({ error: "Snapshot failed", details: err.message });
    })
    .run();
}
