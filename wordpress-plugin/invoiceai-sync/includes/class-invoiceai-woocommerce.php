<?php
/**
 * WooCommerce Order Sync Handler
 *
 * @package InvoiceAI_Sync
 */

if (!defined('ABSPATH')) {
    exit;
}

class InvoiceAI_WooCommerce {
    private $api;

    public function __construct() {
        $this->api = new InvoiceAI_API();

        // Hook into order status changes
        add_action('woocommerce_order_status_changed', array($this, 'on_order_status_changed'), 10, 4);

        // Display PDF download button on order thank-you / receipt page
        add_action('woocommerce_order_details_after_order_table', array($this, 'render_order_receipt_download_button'), 20);

        // Include PDF link in customer email
        add_action('woocommerce_email_after_order_table', array($this, 'render_email_invoice_link'), 20, 4);
    }

    /**
     * Trigger invoice generation on order status transition
     */
    public function on_order_status_changed($order_id, $old_status, $new_status, $order) {
        $target_status = get_option('invoiceai_trigger_status', 'processing');

        if ($target_status === 'any_paid') {
            $qualifying_statuses = array('processing', 'completed');
            if (!in_array($new_status, $qualifying_statuses, true)) {
                return;
            }
        } elseif ($new_status !== $target_status) {
            return;
        }

        $this->sync_order_to_invoice($order_id);
    }

    /**
     * Sync WooCommerce order to InvoiceAI
     */
    public function sync_order_to_invoice($order_id, $force = false) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return false;
        }

        // Avoid duplicate invoice creation unless forced
        $existing_invoice_id = $order->get_meta('_invoiceai_invoice_id');
        if (!empty($existing_invoice_id) && !$force) {
            return true;
        }

        // Customer Details
        $first_name = $order->get_billing_first_name();
        $last_name  = $order->get_billing_last_name();
        $full_name  = trim($first_name . ' ' . $last_name);
        if (empty($full_name)) {
            $full_name = 'Customer #' . $order->get_customer_id();
        }

        $customer_data = array(
            'name'        => $full_name,
            'email'       => $order->get_billing_email(),
            'phone'       => $order->get_billing_phone(),
            'companyName' => $order->get_billing_company(),
            'address'     => trim($order->get_billing_address_1() . ' ' . $order->get_billing_address_2()),
            'city'        => $order->get_billing_city(),
            'state'       => $order->get_billing_state(),
            'postalCode'  => $order->get_billing_postcode(),
            'country'     => $order->get_billing_country(),
        );

        // Order Line Items
        $items = array();
        foreach ($order->get_items() as $item_id => $item) {
            $product     = $item->get_product();
            $line_subtotal = floatval($item->get_subtotal());
            $line_total    = floatval($item->get_total());
            $line_tax      = floatval($item->get_total_tax());
            $quantity      = max(1, $item->get_quantity());
            $unit_price    = $quantity > 0 ? ($line_total / $quantity) : $line_total;

            // Calculate effective tax percentage
            $tax_rate = 0;
            if ($line_total > 0 && $line_tax > 0) {
                $tax_rate = round(($line_tax / $line_total) * 100, 2);
            }

            $items[] = array(
                'name'        => $item->get_name(),
                'description' => $product ? ('SKU: ' . ($product->get_sku() ?: 'N/A')) : '',
                'quantity'    => $quantity,
                'unitPrice'   => round($unit_price, 2),
                'taxRate'     => $tax_rate,
            );
        }

        // Shipping Charges
        $shipping_total = floatval($order->get_shipping_total());
        if ($shipping_total > 0) {
            $shipping_tax = floatval($order->get_shipping_tax());
            $shipping_tax_rate = 0;
            if ($shipping_total > 0 && $shipping_tax > 0) {
                $shipping_tax_rate = round(($shipping_tax / $shipping_total) * 100, 2);
            }

            $items[] = array(
                'name'        => __('Shipping: ', 'invoiceai-sync') . ($order->get_shipping_method() ?: __('Standard Shipping', 'invoiceai-sync')),
                'quantity'    => 1,
                'unitPrice'   => round($shipping_total, 2),
                'taxRate'     => $shipping_tax_rate,
            );
        }

        // Order Level Discount
        $discount_total = floatval($order->get_discount_total());

        // Prepare InvoiceAI Request Payload
        $payload = array(
            'customer'           => $customer_data,
            'items'              => $items,
            'currency'           => $order->get_currency(),
            'issueDate'          => $order->get_date_created() ? $order->get_date_created()->date('Y-m-d') : date('Y-m-d'),
            'dueDate'            => date('Y-m-d', strtotime('+14 days')),
            'referenceNumber'    => 'WC-' . $order->get_order_number(),
            'discountAmount'     => $discount_total,
            'notes'              => sprintf(__('Generated automatically for WooCommerce Order #%s via InvoiceAI.', 'invoiceai-sync'), $order->get_order_number()),
            'autoIssue'          => (get_option('invoiceai_auto_issue', 'yes') === 'yes'),
            'sendEmail'          => (get_option('invoiceai_send_email', 'no') === 'yes'),
        );

        $result = $this->api->create_invoice($payload);

        if (is_wp_error($result)) {
            $order->add_order_note(
                sprintf(__('InvoiceAI Sync Failed: %s', 'invoiceai-sync'), $result->get_error_message())
            );
            return false;
        }

        if (!empty($result['invoice'])) {
            $inv = $result['invoice'];

            // Store metadata on WooCommerce order
            $order->update_meta_data('_invoiceai_invoice_id', $inv['id']);
            $order->update_meta_data('_invoiceai_invoice_number', $inv['invoiceNumber']);
            $order->update_meta_data('_invoiceai_public_url', $inv['publicUrl']);
            $order->update_meta_data('_invoiceai_pdf_url', $inv['pdfDownloadUrl']);
            $order->save();

            // Record payment if order is already paid
            if ($order->is_paid()) {
                $this->api->record_payment($inv['id'], array(
                    'amount'               => floatval($order->get_total()),
                    'paymentMethod'        => $order->get_payment_method_title() ?: 'ONLINE_GATEWAY',
                    'transactionReference' => $order->get_transaction_id() ?: ('WC-' . $order->get_id()),
                    'notes'                => __('WooCommerce Checkout Payment', 'invoiceai-sync'),
                ));
            }

            $order->add_order_note(
                sprintf(
                    __('InvoiceAI Tax Invoice #%1$s generated successfully. <a href="%2$s" target="_blank">View Invoice</a>', 'invoiceai-sync'),
                    esc_html($inv['invoiceNumber']),
                    esc_url($inv['publicUrl'])
                )
            );

            return true;
        }

        return false;
    }

    /**
     * Output download button on customer thank-you and view-order pages
     */
    public function render_order_receipt_download_button($order) {
        if (!get_option('invoiceai_show_pdf_button', 'yes')) {
            return;
        }

        $invoice_number = $order->get_meta('_invoiceai_invoice_number');
        $public_url     = $order->get_meta('_invoiceai_public_url');
        $pdf_url        = $order->get_meta('_invoiceai_pdf_url');

        if (empty($public_url) && empty($pdf_url)) {
            return;
        }

        ?>
        <div class="invoiceai-order-receipt-box" style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
                <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span><?php _e('Official Tax Invoice', 'invoiceai-sync'); ?></span>
                    <?php if (!empty($invoice_number)) : ?>
                        <span style="font-size: 12px; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 9999px; font-family: monospace;">
                            <?php echo esc_html($invoice_number); ?>
                        </span>
                    <?php endif; ?>
                </h4>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                    <?php _e('A certified digital tax invoice has been generated for your records.', 'invoiceai-sync'); ?>
                </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <?php if (!empty($public_url)) : ?>
                    <a href="<?php echo esc_url($public_url); ?>" target="_blank" class="button" style="background: #4f46e5; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                        <span><?php _e('View & Download PDF', 'invoiceai-sync'); ?></span>
                        &rarr;
                    </a>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    /**
     * Add Invoice download link in WooCommerce customer emails
     */
    public function render_email_invoice_link($order, $sent_to_admin, $plain_text, $email) {
        if ($sent_to_admin) {
            return;
        }

        $public_url     = $order->get_meta('_invoiceai_public_url');
        $invoice_number = $order->get_meta('_invoiceai_invoice_number');

        if (empty($public_url)) {
            return;
        }

        if ($plain_text) {
            echo "\n" . sprintf(__('Official Tax Invoice: %s', 'invoiceai-sync'), $public_url) . "\n";
            return;
        }

        ?>
        <div style="margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;">
                <?php printf(__('Your official tax invoice <strong>#%s</strong> is ready.', 'invoiceai-sync'), esc_html($invoice_number)); ?>
            </p>
            <a href="<?php echo esc_url($public_url); ?>" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; display: inline-block;">
                <?php _e('Download Invoice (PDF)', 'invoiceai-sync'); ?>
            </a>
        </div>
        <?php
    }
}
