=== InvoiceAI Sync for WooCommerce ===
Contributors: invoiceai
Tags: woocommerce, invoice, pdf invoices, invoice generator, tax invoice
Requires at least: 5.6
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Automate professional PDF tax invoices, customer sync, and instant customer receipt downloads for WooCommerce orders powered by InvoiceAI.

== Description ==

InvoiceAI Sync connects your WooCommerce store directly to your InvoiceAI SaaS workspace. Whenever a customer places or pays for an order, InvoiceAI automatically:

* Creates a matching tax invoice with line items, tax breakdown, and shipping charges.
* Syncs and links the customer record in your InvoiceAI tenant organization.
* Renders a certified, beautifully formatted PDF invoice.
* Displays a "Download Tax Invoice (PDF)" button on the WooCommerce Order Received (thank-you) page and in the customer's "My Account" area.
* Attaches the PDF link to WooCommerce customer order emails.

== Installation ==

1. Upload the `invoiceai-sync` folder to `/wp-content/plugins/` or upload `invoiceai-sync.zip` via WordPress Admin -> Plugins -> Add New -> Upload Plugin.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to **InvoiceAI** in the WordPress admin menu.
4. Enter your **InvoiceAI API Endpoint** (e.g. `https://your-domain.com/api/v1`) and your **Live API Key** (`inv_live_...`).
5. Click **Test API Connection** to verify connectivity, then click **Save Integration Settings**.

== Frequently Asked Questions ==

= Where do I find my API Key? =
Log in to your InvoiceAI portal, select your company workspace, and go to **Company Settings &rarr; API & Integrations**.

= Is WooCommerce required? =
While the automated order hooks are designed for WooCommerce, you can also use InvoiceAI's REST API directly with any WordPress theme, custom post type, or form plugin.
