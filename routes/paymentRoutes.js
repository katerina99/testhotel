

// const express = require('express');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const router = express.Router();

// // Endpoint to handle payment intent creation and invoice sending
// router.post('/create-payment-intent', async (req, res) => {
//   try {
//     const { amount, currency, payment_method_id, booking_data } = req.body;

//     // Validate inputs
//     if (!amount || amount < 50) {
//       return res.status(400).json({ error: 'Invalid amount. Minimum is 50 cents.' });
//     }

//     if (!payment_method_id) {
//       return res.status(400).json({ error: 'Payment method required.' });
//     }

//     console.log('Creating payment intent:', { amount, currency, payment_method_id });

//     // Create a payment intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: currency || 'eur',
//       payment_method: payment_method_id,
//       confirmation_method: 'manual',
//       confirm: true,
//       return_url: 'https://your-website.com/booking-confirmation',
//       metadata: {
//         booking_type: booking_data?.bookingType || 'unknown',
//         guest_email: booking_data?.guestInfo?.email || 'unknown',
//         total_price: booking_data?.totalPrice?.toString() || '0',
//       },
//     });

//     // Check if payment was successful
//     if (paymentIntent.status === 'succeeded') {
//       console.log('Payment succeeded. Creating invoice...');
//       await createAndSendInvoice(paymentIntent, booking_data);
//     }

//     // Respond with payment intent details
//     res.json({
//       id: paymentIntent.id,
//       status: paymentIntent.status,
//       client_secret: paymentIntent.client_secret,
//       requires_action: paymentIntent.status === 'requires_action',
//     });
//   } catch (err) {
//     console.error('Payment error:', err);
//     res.status(400).json({ 
//       error: err.message || 'Payment processing failed',
//       type: err.type || 'unknown_error',
//       code: err.code || 'unknown_code',
//     });
//   }
// });

// // Function to create and send an invoice
// async function createAndSendInvoice(paymentIntent, bookingData) {
//   try {
//     // Create or retrieve customer
//     const customer = await stripe.customers.create({
//       email: bookingData?.guestInfo?.email,
//       name: `${bookingData?.guestInfo?.firstName || ''} ${bookingData?.guestInfo?.lastName || ''}`,
//       phone: bookingData?.guestInfo?.phone,
//       metadata: {
//         booking_id: paymentIntent.id,
//         booking_type: bookingData?.bookingType || 'hotel',
//       },
//     });

//     // Add invoice items
//     await stripe.invoiceItems.create({
//       customer: customer.id,
//       amount: paymentIntent.amount,
//       currency: paymentIntent.currency,
//       description: `Hotel Booking - ${bookingData?.bookingType || 'Reservation'}`,
//       metadata: {
//         check_in: bookingData?.checkIn || '',
//         check_out: bookingData?.checkOut || '',
//         guests: `${bookingData?.adults || 0} adults, ${bookingData?.children || 0} children`,
//       },
//     });

//     // Create and finalize the invoice
//     const invoice = await stripe.invoices.create({
//       customer: customer.id,
//       collection_method: 'send_invoice',
//       days_until_due: 0, // Due immediately
//       description: `Invoice for Hotel Booking - ${bookingData?.bookingType || 'Reservation'}`,
//       footer: 'Thank you for choosing Union of Scientists in Bulgaria Hotel!',
//     });

//     await stripe.invoices.finalizeInvoice(invoice.id);
//     console.log(`Invoice finalized for customer: ${customer.email}`);

//     // Send the invoice via email
//     await stripe.invoices.sendInvoice(invoice.id);
//     console.log(`Invoice sent to: ${bookingData?.guestInfo?.email}`);
//   } catch (error) {
//     console.error('Error creating/sending invoice:', error.message);
//     // Log the error for debugging purposes
//   }
// }

// module.exports = router;
