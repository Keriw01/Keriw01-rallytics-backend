const axios = require("axios");
const { db, FieldValue } = require("../config/firebase");
const {
  SPORT_DEVS_API_BASE_URL,
  SPORT_DEVS_API_BEARER_TOKEN,
} = require("../config/environment");

const API_LIMIT = 50;

async function fetchAndSaveLiveScores() {
  console.log("Starting to download all live results...");
  let allLiveMatches = [];
  let currentOffset = 0;
  let hasMoreData = true;

  try {
    while (hasMoreData) {
      console.log(`Fetching batch with offset: ${currentOffset}...`);
      const response = await axios.get(`${SPORT_DEVS_API_BASE_URL}/matches`, {
        headers: { Authorization: `Bearer ${SPORT_DEVS_API_BEARER_TOKEN}` },
        params: {
          limit: API_LIMIT,
          offset: currentOffset,
          status_type: "eq.live",
        },
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        const matchesOnPage = response.data;
        console.log(
          `Downloaded ${matchesOnPage.length} matches in this batch.`
        );

        if (matchesOnPage.length > 0) {
          allLiveMatches.push(...matchesOnPage);
        }

        if (matchesOnPage.length < API_LIMIT) {
          hasMoreData = false;
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

    console.log(`Total downloaded ${allLiveMatches.length} live matches.`);

    if (allLiveMatches.length === 0) {
      console.log("No active live matches, completing save task.");
      return;
    }

    const batch = db.batch();
    allLiveMatches.forEach((match) => {
      const matchId = match.id?.toString();
      if (!matchId) {
        console.warn("Skipped match without unique ID:", match);
        return;
      }

      const matchRef = db.collection("live_matches").doc(matchId);
      batch.set(
        matchRef,
        { ...match, lastUpdated: FieldValue.serverTimestamp() },
        { merge: true }
      );
    });

    await batch.commit();
    console.log("Live scores successfully updated in Firestore.");

    const activeMatchIds = allLiveMatches.map((match) => match.id.toString());
    return { activeMatchIds, liveMatchCount: allLiveMatches.length };
  } catch (error) {
    console.error(
      "An error occurred while fetching live scores:",
      error.message
    );
    if (error.response) {
      console.error(
        `API Error: Status ${error.response.status}`,
        error.response.data
      );
    }
    return { activeMatchIds: [], liveMatchCount: 0 };
  }
}

async function cleanupFinishedMatches(activeMatchIds) {
  if (!Array.isArray(activeMatchIds)) {
    console.error("Error: Expected an array of active match IDs for cleanup.");
    return;
  }
  console.log("Running cleanup task for old matches...");

  try {
    const snapshot = await db.collection("live_matches").get();
    if (snapshot.empty) {
      console.log("Database is already empty, no cleanup needed.");
      return;
    }

    const batch = db.batch();
    let deletedCount = 0;
    snapshot.docs.forEach((doc) => {
      if (!activeMatchIds.includes(doc.id)) {
        console.log(`Marking finished match for deletion: ID ${doc.id}`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Successfully removed ${deletedCount} completed matches.`);
    } else {
      console.log("No matches to delete (all are still active).");
    }
  } catch (error) {
    console.error("An error occurred during match cleanup:", error.message);
  }
}

module.exports = { fetchAndSaveLiveScores, cleanupFinishedMatches };
