const { ApifyClient } = require("apify-client");
const { GoogleGenAI } = require("@google/genai");
const {
  APIFY_TOKEN,
  GOOGLE_API_KEY,
  APIFY_DATASET_ID,
} = require("../config/environment");
const { NEWS_REWRITE_PROMPT } = require("../constants");
const { db } = require("../config/firebase");

const apifyClient = new ApifyClient({ token: APIFY_TOKEN });
const genAI = new GoogleGenAI({
  apiKey: GOOGLE_API_KEY,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndRewriteNews() {
  console.log("Starting task: Fetching and rewriting news...");

  try {
    const dataset = await apifyClient.dataset(APIFY_DATASET_ID).listItems();

    const datasetWithoutFirstItem = dataset.items.slice(
      dataset.items.length - 20
    );

    if (!datasetWithoutFirstItem || datasetWithoutFirstItem.length === 0) {
      console.log("No articles found in Apify dataset. Finishing task.");
      return [];
    }

    console.log(`Found ${datasetWithoutFirstItem.length} articles to process.`);
    const rawArticles = datasetWithoutFirstItem;

    const rewrittenArticles = [];

    for (const article of rawArticles) {
      if (!article.title || !article.lead || !article.content) {
        console.warn(
          `Article "${article.title}" skipped beacuse some field is missing.`
        );
        continue;
      }

      const prompt = NEWS_REWRITE_PROMPT.replace("{{title}}", article.title)
        .replace("{{lead}}", article.lead || "")
        .replace("{{content}}", article.content);

      try {
        console.log(`Rewriting article: "${article.title}"...`);

        const result = await genAI.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
        });

        const cleanedText = result.text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const responseJson = JSON.parse(cleanedText);

        rewrittenArticles.push({
          rewrittenTitle: responseJson.newTitle,
          rewrittenContent: responseJson.newContent,
        });
      } catch (err) {
        console.error(
          `Failed to rewrite article: ${article.title}`,
          err.message
        );
      }

      console.log("Waiting 5 seconds before next request...");
      await delay(5000);
    }

    console.log(`Successfully rewritten ${rewrittenArticles.length} articles.`);
    return rewrittenArticles;
  } catch (error) {
    console.error("A critical error occurred in fetchAndRewriteNews:", error);
    return [];
  }
}

async function saveNewsToFirestore(articles) {
  if (!articles || articles.length === 0) {
    console.log("No new articles to save.");
    return;
  }
  console.log(`Saving ${articles.length} rewritten articles to Firestore...`);
  const newsCollectionRef = db.collection("news_articles");

  const snapshot = await newsCollectionRef.get();
  if (!snapshot.empty) {
    const deleteBatch = db.batch();
    snapshot.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log("Successfully cleared old news articles.");
  }

  const addBatch = db.batch();
  articles.forEach((article) => {
    const docRef = newsCollectionRef.doc();
    addBatch.set(docRef, article);
  });
  await addBatch.commit();
  console.log("Successfully saved new articles to Firestore.");
}

module.exports = { fetchAndRewriteNews, saveNewsToFirestore };
