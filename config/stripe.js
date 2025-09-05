const Stripe = require("stripe");
const { STRIPE_SECRET_KEY } = require("./environment");

const stripe = new Stripe(STRIPE_SECRET_KEY);

console.log("Stripe SDK initialized successfully.");

module.exports = stripe;
