const Tenant = require('../models/Tenant');

/**
 * Service to generate and send/log transaction confirmation receipt emails
 */
const sendOrderConfirmationEmail = async (order, tenant) => {
  try {
    let store = tenant;
    if (!store && order.tenantId) {
      store = await Tenant.findById(order.tenantId);
    }

    const storeName = store?.name || 'OmniStore';
    const storeEmail = `support@${store?.slug || 'omnistore'}.store`;
    const banner = store?.branding?.bannerText || 'Thank you for shopping with us.';
    const currency = order.pricing?.currency || 'INR';

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; vertical-align: top;">
            <strong>${item.name}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">SKU: ${item.sku || 'N/A'} • Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 12px 8px; text-align: right; vertical-align: top; font-weight: bold;">
            ₹${(item.itemTotal || item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `
      )
      .join('');

    const emailSubject = `Order Confirmed: ${order.orderNumber} • ${storeName}`;
    const emailBody = `
================================================================================
📧 TRANSACTION CONFIRMATION EMAIL: ${emailSubject}
To: ${order.customer?.name} <${order.customer?.email}>
From: ${storeName} <${storeEmail}>
================================================================================
Dear ${order.customer?.name},

Thank you for your order! We have received your payment and are preparing your package for shipment.

--- ORDER SUMMARY ---
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}
Payment Method: ${order.payment?.method?.toUpperCase()} (Transaction ID: ${order.payment?.transactionId || 'N/A'})
Payment Status: ${order.payment?.status?.toUpperCase()}

--- ITEMS ORDERED ---
${order.items.map((i) => `• ${i.name} (Qty: ${i.quantity}) - ₹${(i.itemTotal || i.price * i.quantity).toLocaleString('en-IN')}`).join('\n')}

Subtotal: ₹${order.pricing?.subtotal?.toLocaleString('en-IN')}
${order.pricing?.discountAmount ? `Coupon Discount (${order.pricing?.couponCode}): -₹${order.pricing?.discountAmount?.toLocaleString('en-IN')}\n` : ''}Shipping: ${order.pricing?.shippingFee === 0 ? 'FREE' : `₹${order.pricing?.shippingFee?.toLocaleString('en-IN')}`}
Total Paid: ₹${order.pricing?.total?.toLocaleString('en-IN')}

--- SHIPPING DESTINATION ---
${order.customer?.shippingAddress?.street}
${order.customer?.shippingAddress?.city}, ${order.customer?.shippingAddress?.state} - ${order.customer?.shippingAddress?.postalCode}
Contact: ${order.customer?.phone}

--- TRACKING ---
Estimated Delivery: 2-4 business days
Track live on storefront: http://localhost:3000/orders?orderNumber=${order.orderNumber}
================================================================================
`;

    // Log the transaction email formatted for verification
    console.log(emailBody);

    return {
      success: true,
      recipient: order.customer?.email,
      orderNumber: order.orderNumber,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating transaction confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail
};
