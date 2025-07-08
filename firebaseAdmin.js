import admin from "firebase-admin";

// Path to the downloaded service account key JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "ebarrio-21814.appspot.com", // ends in .appspot.com (NOT firebasestorage.app)
});

const bucket = admin.storage().bucket();

export { bucket };
