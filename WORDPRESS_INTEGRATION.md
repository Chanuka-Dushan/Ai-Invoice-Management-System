# WordPress & WooCommerce Integration Guide

This guide walks you through connecting your WordPress & WooCommerce online store to **InvoiceAI** using the official `invoiceai-sync` plugin.

---

## 1. Features & Capabilities

- **Automatic Invoice Creation:** Automatically creates a tax invoice in your InvoiceAI company when customers place or complete orders.
- **Customer Synchronization:** Automatically maps customer names, emails, billing addresses, and tax numbers into your tenant customer database.
- **Certified PDF Generation:** Creates high-resolution, branded PDF tax invoices using your company logo, bank details, and layout settings.
- **Customer Download Buttons:** Automatically places a "Download Tax Invoice (PDF)" button on the WooCommerce Order Received (thank-you) page and in the customer's "My Account &rarr; Orders" view.
- **Email Integration:** Inserts an invoice viewing/download link directly into WooCommerce order confirmation emails.
- **WooCommerce Admin Metabox:** View invoice status and trigger manual re-syncing directly from the WooCommerce Order Edit screen.

---

## 2. Installation

### Method A: Upload via WordPress Admin (Recommended)

1. In your InvoiceAI Dashboard, go to **Company Settings &rarr; API & Integrations**.
2. Click **Download WP Plugin** (or download `invoiceai-sync.zip`).
3. Log in to your WordPress Admin dashboard (`/wp-admin`).
4. Navigate to **Plugins &rarr; Add New &rarr; Upload Plugin**.
5. Choose `invoiceai-sync.zip` and click **Install Now**.
6. Click **Activate Plugin**.

### Method B: Manual FTP / File Manager Upload

1. Extract `invoiceai-sync.zip`.
2. Upload the extracted `invoiceai-sync` folder to your server's `/wp-content/plugins/` directory.
3. In WordPress Admin, navigate to **Plugins** and activate **InvoiceAI Sync for WooCommerce**.

---

## 3. Configuration

Once activated, configure the plugin settings:

1. In WordPress Admin, click **InvoiceAI** in the left sidebar menu (or **WooCommerce &rarr; InvoiceAI**).
2. Configure the following fields:

| Setting | Recommended Value | Description |
| :--- | :--- | :--- |
| **InvoiceAI API Endpoint** | `https://your-domain.com/api/v1` | Base URL of your InvoiceAI backend (e.g. `http://localhost:4000/api/v1` for local testing) |
| **Live API Key** | `inv_live_...` | The API Key from your InvoiceAI dashboard (**Company Settings &rarr; API & Integrations**) |
| **Sync Trigger Event** | `When Order is Processing (Paid)` | Which WooCommerce status change should trigger invoice generation |
| **Auto-Issue Invoices** | Checked (`Yes`) | Automatically certifies invoice and makes PDF download links live |
| **Email from InvoiceAI** | Unchecked (`No`) | If checked, InvoiceAI will send a separate email in addition to WooCommerce |
| **Customer PDF Button** | Checked (`Yes`) | Displays the download button on order receipts and customer portal |

3. Click the **Test API Connection** button:
   - A green checkmark with `Connected successfully to "Your Company Name"` indicates proper connectivity.
4. Click **Save Integration Settings**.

---

## 4. How the Integration Works in Practice

```
Customer completes checkout on WooCommerce
           │
           ▼
WooCommerce triggers order status change (e.g., 'processing' or 'completed')
           │
           ▼
invoiceai-sync plugin extracts:
 - Customer info (Name, Email, Phone, Billing Address)
 - Line items, Quantities, Unit Prices
 - Shipping total & Method
 - Discounts & Coupon deductions
           │
           ▼
HTTP POST to InvoiceAI API (/api/v1/invoices) with X-API-KEY
           │
           ▼
InvoiceAI generates:
 - Next sequential invoice number (e.g., INV-2026-0042)
 - Backend decimal total validation
 - Branded PDF invoice with company logo & payment terms
 - Unique public viewing token
           │
           ▼
WooCommerce Order updated:
 - Order metadata saved: `_invoiceai_invoice_id`, `_invoiceai_invoice_number`, `_invoiceai_public_url`
 - Order note added with link
 - PDF Download button injected on customer receipt & email
```

---

## 5. WooCommerce Order Management Screen

When viewing any order in WordPress Admin (**WooCommerce &rarr; Orders &rarr; Order #XYZ**):

- Look at the right sidebar to locate the **InvoiceAI Tax Invoice** metabox.
- It displays:
  - **Invoice #**: e.g., `INV-2026-0042`
  - **Status**: `SYNCED & ISSUED`
  - **View Invoice Online** button linking directly to the certified invoice.
- If an order has not yet synced, an admin can click **Generate Invoice Now** to manually create the invoice on demand.

---

## 6. Troubleshooting

### Connection Test Fails (HTTP 401 Unauthorized)
- Ensure the API key begins with `inv_live_` and does not contain extra spaces.
- If you regenerated the API key in InvoiceAI, you must paste the new key in WordPress.

### Order not syncing automatically
- Ensure the order status matches the configured **Sync Trigger Event** (e.g., if set to `completed`, processing orders will not trigger invoice creation until marked completed).
- Check WooCommerce order notes: if InvoiceAI encountered a validation issue (e.g., missing currency or empty items), the error message is recorded in the order note log.

### Localhost / Self-Signed SSL issues
- If running WordPress and InvoiceAI on a local computer without valid SSL, add `add_filter('https_ssl_verify', '__return_false');` in `wp-config.php` for local testing only.
