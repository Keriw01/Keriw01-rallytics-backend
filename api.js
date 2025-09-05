require("./config/environment");
const express = require("express");
const cors = require("cors");
const { createPaymentIntent } = require("./services/paymentService");
const { PORT } = require("./config/environment");

const app = express();
const port = PORT;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send({ status: "API is running" });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    const { clientSecret } = await createPaymentIntent(amount);

    res.status(200).send({ clientSecret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server is listening on port ${port}`);
});
