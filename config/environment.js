require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? "./.env.prod" : "./.env.dev",
});

const environment = process.env.NODE_ENV || "development";
console.log(`Run in the environment: ${environment}.`);

module.exports = {
  environment,
  PORT: process.env.PORT,
  SPORT_DEVS_API_BASE_URL: process.env.SPORT_DEVS_API_BASE_URL,
  SPORT_DEVS_API_BEARER_TOKEN: process.env.SPORT_DEVS_API_BEARER_TOKEN,
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  APIFY_DATASET_ID: process.env.APIFY_DATASET_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
};
