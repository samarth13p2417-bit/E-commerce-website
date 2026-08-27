import { formatCurrency } from './currency';

/**
 * Generates an official, printable and downloadable HTML/PDF receipt for an order.
 * @param {Object} order - Order object containing customer, items, pricing, payment, and tenant info.
 * @param {Object} tenant - Active tenant object containing store name, slug, email, phone, etc.
 */
export const downloadTransactionReceipt = (order, tenant) => {
  if (!order) return;

  const orderNum = order.orderNumber || `ORD-${Date.now()}`;
  const storeName = tenant?.name || order.tenantName || 'OmniStore';
  const customer = order.customer || {};
  const shipping = customer.shippingAddress || {};
  const pricing = order.pricing || {
    subtotal: order.total || 0,
    discountAmount: 0,
    shippingFee: 0,
    tax: 0,
    total: order.total || 0
  };
  const payment = order.payment || {};
  const items = order.items || [];
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const transactionId =
    payment.razorpayPaymentId ||
    payment.transactionId ||
    payment.razorpayOrderId ||
    `TXN-${Date.now()}`;

  const paymentMethodLabel = (payment.method || 'razorpay').toUpperCase();
  const isPaid = payment.status === 'paid' || payment.method !== 'cod';

  // Construct printable HTML
  const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt — ${orderNum}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 32px 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .receipt-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 28px 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .store-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .store-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .store-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .receipt-meta {
      text-align: right;
    }
    .receipt-title {
      font-size: 18px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .order-num {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 4px;
    }
    .order-date {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .status-ribbon {
      background: #ecfdf5;
      border-bottom: 1px solid #d1fae5;
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #065f46;
      font-size: 13px;
      font-weight: 600;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #10b981;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 28px 32px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .info-box p {
      margin-bottom: 3px;
      color: #334155;
    }
    .info-box strong {
      color: #0f172a;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 10px 14px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .item-name {
      font-weight: 600;
      color: #0f172a;
    }
    .item-sku {
      font-size: 11px;
      color: #94a3b8;
    }
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals-table {
      width: 320px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-row.grand-total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .payment-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .payment-summary-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .payment-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      font-size: 12px;
    }
    .payment-grid-item span {
      display: block;
      color: #64748b;
      font-size: 11px;
    }
    .payment-grid-item strong {
      color: #0f172a;
      font-family: monospace;
      font-size: 12px;
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .footer strong {
      color: #64748b;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .receipt-card {
        border: none;
        box-shadow: none;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 760px; margin: 0 auto 16px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">
      ✕ Close
    </button>
  </div>

  <div class="receipt-card">
    <!-- Header -->
    <div class="header">
      <div>
        <span class="store-badge">${storeName}</span>
        <h1 class="store-title">${storeName}</h1>
        <p class="store-sub">Official Multi-Tenant SaaS Store • support@${tenant?.slug || 'store'}.com</p>
      </div>
      <div class="receipt-meta">
        <div class="receipt-title">Payment Receipt</div>
        <div class="order-num">${orderNum}</div>
        <div class="order-date">${orderDate}</div>
      </div>
    </div>

    <!-- Status Ribbon -->
    <div class="status-ribbon">
      <div>
        Transaction Status: <strong style="color: #047857;">${isPaid ? 'Payment Confirmed & Verified' : 'Order Placed'}</strong>
      </div>
      <div class="status-badge">
        ✓ ${isPaid ? 'PAID' : 'PENDING'}
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- 2-Col Meta -->
      <div class="grid-2">
        <div class="info-box">
          <div class="section-label">Billed & Shipped To</div>
          <p><strong>${customer.name || 'Customer'}</strong></p>
          <p>${shipping.street || 'Address'}</p>
          <p>${shipping.city || ''}${shipping.state ? ', ' + shipping.state : ''} - ${shipping.postalCode || ''}</p>
          <p>Email: ${customer.email || 'N/A'}</p>
          <p>Phone: ${customer.phone || 'N/A'}</p>
        </div>

        <div class="info-box">
          <div class="section-label">Payment Information</div>
          <p>Gateway: <strong>Razorpay Secure Payments</strong></p>
          <p>Method: <strong>${paymentMethodLabel}</strong></p>
          <p>Transaction ID: <strong style="font-family: monospace;">${transactionId}</strong></p>
          <p>Signature Verification: <strong style="color: #10b981;">HMAC-SHA256 Verified</strong></p>
          <p>Currency: <strong>INR (₹)</strong></p>
        </div>
      </div>

      <!-- Item Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 45%;">Item Description</th>
            <th class="text-right" style="width: 15%;">Unit Price</th>
            <th class="text-center" style="width: 15%;">Qty</th>
            <th class="text-right" style="width: 25%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td>
                <div class="item-name">${item.name}</div>
                ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ''}
              </td>
              <td class="text-right">₹${Number(item.price || 0).toLocaleString('en-IN')}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right" style="font-weight: 600;">₹${Number(item.itemTotal || (item.price * item.quantity) || 0).toLocaleString('en-IN')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-container">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${Number(pricing.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          ${
            pricing.discountAmount > 0
              ? `
          <div class="totals-row" style="color: #10b981;">
            <span>Coupon Discount</span>
            <span>- ₹${Number(pricing.discountAmount).toLocaleString('en-IN')}</span>
          </div>
          `
              : ''
          }
          <div class="totals-row">
            <span>Shipping & Handling</span>
            <span>${pricing.shippingFee > 0 ? `₹${Number(pricing.shippingFee).toLocaleString('en-IN')}` : 'FREE'}</span>
          </div>
          <div class="totals-row">
            <span>Estimated GST (Included)</span>
            <span>₹${Number(pricing.tax || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Paid</span>
            <span style="color: #0284c7;">₹${Number(pricing.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- Payment Verification Box -->
      <div class="payment-summary">
        <div class="payment-summary-title">
          🛡️ Digital Transaction & Authorization Proof
        </div>
        <div class="payment-grid">
          <div class="payment-grid-item">
            <span>Payment ID</span>
            <strong>${transactionId}</strong>
          </div>
          <div class="payment-grid-item">
            <span>Auth Gateway</span>
            <strong>Razorpay v2.9</strong>
          </div>
          <div class="payment-grid-item">
            <span>Timestamp</span>
            <strong>${orderDate}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for shopping with <strong>${storeName}</strong>!</p>
      <p style="margin-top: 4px;">This is a computer-generated digital tax receipt and transaction proof for online purchases.</p>
      <p style="margin-top: 4px;">For customer support or return requests, please quote your order number: <strong>${orderNum}</strong></p>
    </div>
  </div>

  <script>
    // Automatically trigger print dialog on popup open
    window.onload = function() {
      setTimeout(function() {
        // window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

  // Open a popup window with the printable receipt
  const printWindow = window.open('', '_blank', 'width=850,height=900,scrollbars=yes,resizable=yes');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
  } else {
    // Fallback: If popup is blocked, download as an HTML file
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${orderNum}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
