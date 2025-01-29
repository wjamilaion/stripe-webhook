import { Readable } from "stream";
import Stripe from "stripe";

const STRIPE_SIGNATURE = "stripe-signature";
const stripEvents = {
    "checkout.session.completed": "checkout.session.completed",    
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // Important: This is required for raw body handling
  },
};

// Helper function to read the raw body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of Readable.toWeb(req)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sig = req.headers[STRIPE_SIGNATURE];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  stripEventsHandler(event)

  res.status(200).json({ received: true });
}

const stripEventsHandler = (event) => {
    switch (event.type) {
        case stripEvents["checkout.session.completed"]:
            return sessionCompletedEvent(event.data.object);
        default:
            return;
    }
}
const sessionCompletedEvent = (data) => {
    console.log("Payment successful:", data);
    // do more stuff here
}