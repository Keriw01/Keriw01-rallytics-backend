const cron = require("node-cron");
const {
  fetchAndSaveLiveScores,
  cleanupFinishedMatches,
} = require("./services/liveScoreService");
const {
  fetchAndRewriteNews,
  saveNewsToFirestore,
} = require("./services/newsService");
const {
  FAST_INTERVAL_MS,
  SLOW_INTERVAL_MS,
  NEWS_CRON_SCHEDULE,
  NEWS_CRON_TIMEZONE,
} = require("./constants");

let isLiveScoreTaskRunning = false;

async function runLiveScoreCycle() {
  if (isLiveScoreTaskRunning) {
    console.log("Live score cycle is still running. Skipping.");
    return;
  }
  isLiveScoreTaskRunning = true;
  console.log("----------------- NEW LIVE SCORE CYCLE -----------------");

  try {
    const { activeMatchIds, liveMatchCount } = await fetchAndSaveLiveScores();

    if (activeMatchIds) {
      await cleanupFinishedMatches(activeMatchIds);
    }

    const nextInterval =
      liveMatchCount > 0 ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
    console.log(`Next live score check in ${nextInterval / 60000} minutes.`);
    setTimeout(runLiveScoreCycle, nextInterval);
  } catch (e) {
    console.error("An unexpected error occurred in the live score cycle:", e);
    setTimeout(runLiveScoreCycle, SLOW_INTERVAL_MS);
  } finally {
    isLiveScoreTaskRunning = false;
  }
}

async function runNewsCycle() {
  console.log(
    "================= STARTING 4-HOURLY NEWS TASK ================="
  );
  const rewrittenArticles = await fetchAndRewriteNews();
  await saveNewsToFirestore(rewrittenArticles);
  console.log(
    "================= 4-HOURLY NEWS TASK FINISHED ================="
  );
}

function start() {
  console.log("Worker is running. Initializing tasks...");

  runLiveScoreCycle();

  cron.schedule(NEWS_CRON_SCHEDULE, runNewsCycle, {
    timezone: NEWS_CRON_TIMEZONE,
  });
  console.log(
    `News Articles cron job scheduled with pattern: "${NEWS_CRON_SCHEDULE}"`
  );
}

module.exports = { start };
