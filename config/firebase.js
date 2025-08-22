const admin = require("firebase-admin");
const { environment } = require("./environment");

const serviceAccountPath =
  environment === "production"
    ? "../service_account_key.prod.json"
    : "../service_account_key.dev.json";
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
console.log(`Firebase Admin SDK connected for environment: ${environment}.`);

module.exports = { db, FieldValue: admin.firestore.FieldValue };
