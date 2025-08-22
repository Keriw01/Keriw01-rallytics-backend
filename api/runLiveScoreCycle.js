const {
  fetchAndSaveLiveScores,
  cleanupFinishedMatches,
} = require("../services/liveScoreService");

module.exports = async (req, res) => {
  try {
    console.log("----------------- NEW LIVE SCORE CYCLE -----------------");
    const { activeMatchIds, liveMatchCount } = await fetchAndSaveLiveScores();

    if (activeMatchIds) {
      await cleanupFinishedMatches(activeMatchIds);
    }

    res.status(200).json({ status: "success", liveMatches: liveMatchCount });
  } catch (error) {
    console.error(
      "An unexpected error occurred in the live score cycle:",
      error
    );
    res.status(500).json({ status: "error", message: error.message });
  }
};
