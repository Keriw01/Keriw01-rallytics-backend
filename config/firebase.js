const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable not set.");
  }

  const serviceAccountJson = Buffer.from(
    serviceAccountBase64,
    "base64"
  ).toString("utf-8");
  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK successfully connected.");
}

const db = admin.firestore();

module.exports = { db, FieldValue: admin.firestore.FieldValue };
