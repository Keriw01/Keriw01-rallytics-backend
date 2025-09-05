const stripe = require("../config/stripe");

async function createPaymentIntent(amount, currency = "pln") {
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount specified.");
  }

  console.log(`Creating PaymentIntent for amount: ${amount} ${currency}`);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: currency,
      payment_method_types: ["p24", "blik"],
    });

    console.log(`Successfully created PaymentIntent: ${paymentIntent.id}`);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating Stripe PaymentIntent:", error);
    throw new Error(error.message || "Could not create payment intent.");
  }
}

module.exports = { createPaymentIntent };
