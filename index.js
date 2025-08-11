const admin = require("firebase-admin");
const axios = require("axios");
const cron = require("node-cron");

const environment = process.env.NODE_ENV || "development";
console.log(`Run in the environment: ${environment}`);

if (environment === "production") {
  require("dotenv").config({ path: "./.env.prod" });
} else {
  require("dotenv").config({ path: "./.env.dev" });
}

const serviceAccountPath =
  environment === "production"
    ? "./service_account_key.prod.json"
    : "./service_account_key.dev.json";
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
console.log(
  `Firebase Admin SDK connected to the project for the environment: ${environment}.`
);

async function fetchAndSaveLiveScores() {
  console.log("Starting to download all live results pages...");

  let allLiveMatches = [];
  let currentOffset = 0;
  let hasMoreData = true;
  const API_LIMIT = 50;

  try {
    while (hasMoreData) {
      console.log(
        `I am getting a batch of results with an offset:${currentOffset}...`
      );
      const response = await axios.get(
        `${process.env.SPORT_DEVS_API_BASE_URL}/matches`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SPORT_DEVS_API_BEARER_TOKEN}`,
          },
          params: {
            limit: API_LIMIT,
            offset: currentOffset,
            status_type: "eq.live",
          },
        }
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const matchesOnPage = response.data;
        console.log(
          `Downloaded ${matchesOnPage.length} matches in this batch.`
        );

        if (matchesOnPage.length > 0) {
          allLiveMatches = allLiveMatches.concat(matchesOnPage);
        }

        if (matchesOnPage.length < API_LIMIT) {
          hasMoreData = false;
          console.log("This was the last page of data. Finishing download.");
        } else {
          currentOffset += API_LIMIT;
        }
      } else {
        console.warn(
          `Problem with API response at offset ${currentOffset}. Status: ${response.status}`
        );
        hasMoreData = false;
      }
    }

    console.log(
      `Total downloads ${allLiveMatches.length} live matches from all sides.`
    );

    if (allLiveMatches.length === 0) {
      console.log("No active live matches, completing save task.");
      return;
    }

    const batch = db.batch();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    allLiveMatches.forEach((match) => {
      const matchId = match.id?.toString();
      if (!matchId) {
        console.warn("Skipped match without unique ID:", match);
        return;
      }

      const matchRef = db.collection("live_matches").doc(matchId);
      const dataToSet = { ...match, lastUpdated: serverTimestamp };
      batch.set(matchRef, dataToSet, { merge: true });
    });

    await batch.commit();
    console.log(
      "Data from all sites has been successfully updated in Firestore."
    );
  } catch (error) {
    if (error.response) {
      console.error(
        `API Error: Status Received ${error.response.status} with data:`,
        error.response.data
      );
    } else {
      console.error(
        "A critical error occurred while retrieving data:",
        error.message
      );
    }
  }
}

async function cleanupStaleMatches() {
  console.log("Running a task to clean up inactive matches...");

  const threshold = new Date(Date.now() - 3 * 60 * 1000);

  try {
    const staleMatchesQuery = db
      .collection("live_matches")
      .where("lastUpdated", "<", threshold);
    const snapshot = await staleMatchesQuery.get();

    if (snapshot.empty) {
      console.log("No inactive matches found to delete.");
      return;
    }

    console.log(`Found ${snapshot.size} inactive matches to be deleted.`);

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Inactive matches have been successfully deleted.");
  } catch (error) {
    console.error(
      "An error occurred while clearing inactive matches:",
      error.message
    );
  }
}

cron.schedule("*/5 * * * *", () => {
  fetchAndSaveLiveScores();
});

cron.schedule("*/5 * * * *", () => {
  cleanupStaleMatches();
});

console.log("Worker running. Waiting for scheduled tasks...");

fetchAndSaveLiveScores();
cleanupStaleMatches();
