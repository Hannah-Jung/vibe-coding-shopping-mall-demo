const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecretKey) {
  console.error(
    "WARNING: STRIPE_SECRET_KEY is not set in environment variables!"
  );
}
const stripe = require("stripe")(stripeSecretKey);

// Create Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    console.log("[DEBUG] Creating checkout session...");
    console.log("[DEBUG] Request body:", JSON.stringify(req.body, null, 2));
    console.log("[DEBUG] Stripe key exists:", !!stripeSecretKey);
    console.log("[DEBUG] Stripe key prefix:", stripeSecretKey.substring(0, 7));

    const {
      amount,
      currency = "usd",
      metadata = {},
      shippingInfo,
      orderItems,
      shippingFee = 0,
      discountAmount = 0,
    } = req.body;

    if (!amount || amount <= 0) {
      console.error("[DEBUG] Invalid amount:", amount);
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0.",
      });
    }

    if (!stripeSecretKey) {
      console.error("[DEBUG] Stripe secret key is missing");
      return res.status(500).json({
        success: false,
        message: "Stripe configuration error. Please contact support.",
        error: "STRIPE_SECRET_KEY is not configured",
      });
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Stripe minimum amount check (minimum $0.50 USD = 50 cents)
    const MINIMUM_AMOUNT_CENTS = 50;
    if (amountInCents < MINIMUM_AMOUNT_CENTS) {
      console.error(
        `[DEBUG] Amount too small: ${amountInCents} cents ($${amount} USD)`
      );
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is $${
          MINIMUM_AMOUNT_CENTS / 100
        }. Your order total is $${amount.toFixed(2)}.`,
        error: "AMOUNT_TOO_SMALL",
        errorCode: "amount_too_small",
        minimumAmount: MINIMUM_AMOUNT_CENTS / 100,
        currentAmount: amount,
      });
    }

    // Create line items for Stripe Checkout
    let lineItems = [];

    // Add product items
    if (orderItems && orderItems.length > 0) {
      lineItems = orderItems
        .map((item) => {
          const productName =
            item.product?.name || item.productName || "Product";
          const productImage = item.product?.image || item.productImage;
          const itemPrice = item.price || 0;
          const itemQuantity = item.quantity || 1;

          if (itemPrice <= 0) {
            console.warn(
              `[DEBUG] Item has invalid price: ${itemPrice}, skipping`
            );
            return null;
          }

          return {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: productName,
                ...(productImage && { images: [productImage] }),
              },
              unit_amount: Math.round(itemPrice * 100),
            },
            quantity: itemQuantity,
          };
        })
        .filter((item) => item !== null); // Remove null items
    }

    // Add shipping fee as a line item if it exists
    if (shippingFee > 0) {
      console.log("[DEBUG] Adding shipping fee to line items:", shippingFee);
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: "Shipping Fee",
          },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1,
      });
    }

    // Note: Discount is already included in the total amount (amount parameter)
    // Stripe doesn't support negative line items, so discount is handled by
    // calculating the total with discount already applied
    if (discountAmount > 0) {
      console.log(
        "[DEBUG] Discount amount:",
        discountAmount,
        "(already included in total)"
      );
    }

    // If no valid line items, create a single line item for the total
    if (lineItems.length === 0) {
      console.log("[DEBUG] No valid line items, creating single total item");
      lineItems = [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: "Order Total",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ];
    }

    console.log("[DEBUG] Line items:", JSON.stringify(lineItems, null, 2));
    console.log("[DEBUG] Line items count:", lineItems.length);
    console.log(
      "[DEBUG] Client URL:",
      process.env.CLIENT_URL || "http://localhost:5173"
    );
    console.log("[DEBUG] Amount in cents:", amountInCents);

    // Validate line items
    if (lineItems.length === 0) {
      console.error("[DEBUG] No line items to create checkout session");
      return res.status(400).json({
        success: false,
        message: "No valid items found in order.",
        error: "EMPTY_LINE_ITEMS",
      });
    }

    // Get customer email from metadata (user account email)
    // CRITICAL: We do NOT use customer_email here because Stripe will prefill
    // with existing Customer object data. Even if the user changes the information
    // in the Checkout form, Stripe may still use the Customer object data if the
    // user doesn't explicitly change every field. This causes customer_details to
    // contain stale Customer object data instead of what the user actually entered.
    //
    // Solution: Don't use customer_email at all. Let Stripe collect fresh information
    // from the user. If the user enters an email that matches an existing Customer,
    // Stripe will still prefill, but at least we're not forcing it with customer_email.
    const customerEmail = metadata?.email || null;

    // Create Checkout Session
    console.log("[DEBUG] Calling Stripe API...");
    console.log(
      "[DEBUG] Customer email (for metadata only, NOT used in session):",
      customerEmail
    );

    // Debug: Log CLIENT_URL environment variable
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    console.log("[DEBUG] CLIENT_URL from env:", process.env.CLIENT_URL);
    console.log("[DEBUG] Using CLIENT_URL:", clientUrl);

    const sessionConfig = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout?canceled=true`,
      metadata: {
        ...metadata,
        shippingInfo: JSON.stringify(shippingInfo || {}),
        // Store email in metadata for reference, but don't use customer_email
        // to avoid prefill issues
        userEmail: customerEmail || "",
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "KR"],
      },
      phone_number_collection: {
        enabled: true,
      },
      // Always create a new customer to ensure fresh data collection
      // This prevents Stripe from using existing Customer object data
      customer_creation: "always",
    };

    // DO NOT use customer_email - it causes Stripe to prefill with existing
    // Customer object data, which then gets saved to customer_details even
    // if the user changes the information in the Checkout form.
    //
    // Even with customer_creation: 'always', if customer_email is provided,
    // Stripe will still prefill with existing Customer data if a Customer
    // object exists for that email. The only way to ensure fresh data is to
    // not use customer_email at all and let the user enter their email manually.

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("[DEBUG] Checkout session created successfully:", session.id);

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("[DEBUG] Error creating checkout session:");
    console.error("[DEBUG] Error type:", error.type);
    console.error("[DEBUG] Error message:", error.message);
    console.error("[DEBUG] Error code:", error.code);
    console.error("[DEBUG] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error occurred while creating checkout session.",
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
    });
  }
};

// Create Payment Intent (for direct payment)
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0.",
      });
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while creating payment intent.",
      error: error.message,
    });
  }
};

// Confirm Payment Intent
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment Intent ID is required.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while confirming payment.",
      error: error.message,
    });
  }
};

// Get Checkout Session
const getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required.",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "payment_intent"],
    });

    // customer_details contains what user entered in Checkout form
    // If customer object exists, customer_details may contain customer object data
    // We need to check if customer_details was modified by user
    const customerDetails = session.customer_details || null;
    const shippingDetails = session.shipping_details || null;

    console.log(
      "[DEBUG] Session customer_details:",
      JSON.stringify(customerDetails, null, 2)
    );
    console.log(
      "[DEBUG] Session shipping_details:",
      JSON.stringify(shippingDetails, null, 2)
    );
    console.log("[DEBUG] Session customer:", session.customer);

    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        metadata: session.metadata,
        customer_details: customerDetails,
        shipping_details: shippingDetails,
        customer: session.customer || null, // Include customer object to check if it exists
      },
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while retrieving checkout session.",
      error: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  confirmPayment,
  getCheckoutSession,
};
