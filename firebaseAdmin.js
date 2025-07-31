// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import admin from "firebase-admin";

// // Fix __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load JSON manually
// const serviceAccount = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "ebarrio-21814.firebasestorage.app", // ✅ correct bucket format
// });

// const bucket = admin.storage().bucket();
// export { bucket };

import admin from "firebase-admin";

// Path to the downloaded service account key JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "ebarrio-21814.firebasestorage.app", // ends in .appspot.com (NOT firebasestorage.app)
});

const bucket = admin.storage().bucket();

export { bucket };
