const {
  fetchAndRewriteNews,
  saveNewsToFirestore,
} = require("../services/newsService");

module.exports = async (req, res) => {
  try {
    console.log(
      "================= STARTING SCHEDULED NEWS TASK ================="
    );
    const rewrittenArticles = await fetchAndRewriteNews();
    await saveNewsToFirestore(rewrittenArticles);
    console.log(
      "================= SCHEDULED NEWS TASK FINISHED ================="
    );

    res
      .status(200)
      .json({ status: "success", articlesProcessed: rewrittenArticles.length });
  } catch (error) {
    console.error("A critical error occurred in the news cycle:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
