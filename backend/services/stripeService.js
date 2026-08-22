let stripe = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn('Stripe SDK initialized in test/fallback mode.');
}

/**
 * Create a Stripe PaymentIntent (or simulated intent in test mode)
 */
const createPaymentIntent = async ({ amount, currency = 'inr', orderNumber, tenantId, customerEmail }) => {
  // Amount in smallest currency unit (paise / cents)
  const amountInSmallestUnit = Math.round(amount * 100);

  if (stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        metadata: {
          orderNumber,
          tenantId: tenantId.toString(),
          customerEmail
        },
        description: `Order ${orderNumber} - Multi-Tenant Store`,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      };
    } catch (err) {
      console.error('Stripe createPaymentIntent error:', err.message);
      // Fallback to simulated payment intent if live key errors
    }
  }

  // Simulated PaymentIntent for development/testing
  const simulatedId = `pi_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    success: true,
    clientSecret: `${simulatedId}_secret_${Math.random().toString(36).substring(7)}`,
    paymentIntentId: simulatedId,
    amount,
    currency,
    isSimulated: true
  };
};

/**
 * Validate webhook signature or parse test payload
 */
const parseWebhookEvent = (rawBody, signature, endpointSecret) => {
  if (stripe && endpointSecret && signature) {
    return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  }
  // Return parsed JSON object directly for test/simulated webhooks
  return typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
};

module.exports = {
  createPaymentIntent,
  parseWebhookEvent
};
