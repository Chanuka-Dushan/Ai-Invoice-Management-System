<?php
/**
 * InvoiceAI Admin Settings & Metabox Handler
 *
 * @package InvoiceAI_Sync
 */

if (!defined('ABSPATH')) {
    exit;
}

class InvoiceAI_Admin {
    private $api;

    public function __construct() {
        $this->api = new InvoiceAI_API();

        // Admin Menu
        add_action('admin_menu', array($this, 'register_admin_menu'));

        // Register Settings
        add_action('admin_init', array($this, 'register_settings'));

        // AJAX Test Connection Handler
        add_action('wp_ajax_invoiceai_test_connection', array($this, 'ajax_test_connection'));

        // WooCommerce Order Screen Metabox
        add_action('add_meta_boxes', array($this, 'add_order_metabox'));

        // Manual Re-sync Action
        add_action('admin_post_invoiceai_manual_sync', array($this, 'handle_manual_sync'));
    }

    public function register_admin_menu() {
        add_menu_page(
            __('InvoiceAI Settings', 'invoiceai-sync'),
            __('InvoiceAI', 'invoiceai-sync'),
            'manage_options',
            'invoiceai-settings',
            array($this, 'render_settings_page'),
            'dashicons-media-spreadsheet',
            56
        );
    }

    public function register_settings() {
        register_setting('invoiceai_settings_group', 'invoiceai_api_url', array(
            'type'              => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default'           => 'http://localhost:4000/api/v1',
        ));

        register_setting('invoiceai_settings_group', 'invoiceai_api_key', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ));

        register_setting('invoiceai_settings_group', 'invoiceai_trigger_status', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => 'processing',
        ));

        register_setting('invoiceai_settings_group', 'invoiceai_auto_issue', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => 'yes',
        ));

        register_setting('invoiceai_settings_group', 'invoiceai_send_email', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => 'no',
        ));

        register_setting('invoiceai_settings_group', 'invoiceai_show_pdf_button', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => 'yes',
        ));
    }

    public function ajax_test_connection() {
        check_ajax_referer('invoiceai_admin_nonce', 'security');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized user'));
        }

        $api_key = isset($_POST['api_key']) ? sanitize_text_field($_POST['api_key']) : '';
        $api_url = isset($_POST['api_url']) ? esc_url_raw($_POST['api_url']) : '';

        if (empty($api_key)) {
            wp_send_json_error(array('message' => 'Please enter an API Key.'));
        }

        // Test ping directly
        $url = untrailingslashit($api_url) . '/ping';
        $response = wp_remote_get($url, array(
            'timeout' => 15,
            'headers' => array(
                'X-API-KEY' => $api_key,
                'Content-Type' => 'application/json',
            ),
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Connection failed: ' . $response->get_error_message()));
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code === 200 && isset($body['status']) && $body['status'] === 'ok') {
            $company_name = isset($body['company']['name']) ? $body['company']['name'] : 'Unknown';
            $currency     = isset($body['company']['currency']) ? $body['company']['currency'] : 'USD';
            wp_send_json_success(array(
                'message' => sprintf(
                    __('Connected successfully to "%1$s" (Default Currency: %2$s)', 'invoiceai-sync'),
                    $company_name,
                    $currency
                ),
            ));
        } else {
            $err_msg = isset($body['message']) ? $body['message'] : 'HTTP Error ' . $status_code;
            wp_send_json_error(array('message' => 'Validation error: ' . $err_msg));
        }
    }

    public function render_settings_page() {
        $api_url           = get_option('invoiceai_api_url', 'http://localhost:4000/api/v1');
        $api_key           = get_option('invoiceai_api_key', '');
        $trigger_status    = get_option('invoiceai_trigger_status', 'processing');
        $auto_issue        = get_option('invoiceai_auto_issue', 'yes');
        $send_email        = get_option('invoiceai_send_email', 'no');
        $show_pdf_button   = get_option('invoiceai_show_pdf_button', 'yes');
        ?>
        <div class="wrap" style="max-width: 900px; margin-top: 20px;">
            <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px;">
                            <span style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">✨</span>
                            <span>InvoiceAI Sync</span>
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #64748b; font-size: 14px;">
                            <?php _e('Automate tax invoices, customer sync, and PDF receipt downloads for your WooCommerce store.', 'invoiceai-sync'); ?>
                        </p>
                    </div>
                    <span style="background: #eef2ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px;">v1.0.0</span>
                </div>

                <form method="post" action="options.php">
                    <?php settings_fields('invoiceai_settings_group'); ?>

                    <table class="form-table" role="presentation">
                        <tr>
                            <th scope="row">
                                <label for="invoiceai_api_url"><?php _e('InvoiceAI API Endpoint', 'invoiceai-sync'); ?></label>
                            </th>
                            <td>
                                <input name="invoiceai_api_url" type="url" id="invoiceai_api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" style="width: 100%; max-width: 480px; padding: 8px 12px; border-radius: 6px;" placeholder="https://your-invoiceai-domain.com/api/v1" required />
                                <p class="description" style="margin-top: 6px;">
                                    <?php _e('The API base URL of your InvoiceAI installation (e.g. https://app.invoiceai.com/api/v1).', 'invoiceai-sync'); ?>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="invoiceai_api_key"><?php _e('Live API Key', 'invoiceai-sync'); ?></label>
                            </th>
                            <td>
                                <input name="invoiceai_api_key" type="password" id="invoiceai_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" style="width: 100%; max-width: 480px; padding: 8px 12px; border-radius: 6px; font-family: monospace;" placeholder="inv_live_..." required />
                                <button type="button" id="invoiceai_toggle_key" class="button" style="margin-left: 6px; vertical-align: middle;">Show</button>
                                <p class="description" style="margin-top: 6px;">
                                    <?php _e('Obtain this from your InvoiceAI dashboard under <strong>Company Settings &rarr; API & Integrations</strong>.', 'invoiceai-sync'); ?>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><?php _e('Test API Connection', 'invoiceai-sync'); ?></th>
                            <td>
                                <button type="button" id="invoiceai_test_btn" class="button button-secondary" style="height: 38px; padding: 0 16px; border-radius: 6px; font-weight: 600;">
                                    <?php _e('Test API Connection', 'invoiceai-sync'); ?>
                                </button>
                                <span id="invoiceai_test_feedback" style="margin-left: 12px; font-weight: 600; font-size: 13px; vertical-align: middle;"></span>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="invoiceai_trigger_status"><?php _e('Sync Trigger Event', 'invoiceai-sync'); ?></label>
                            </th>
                            <td>
                                <select name="invoiceai_trigger_status" id="invoiceai_trigger_status" style="padding: 6px 12px; border-radius: 6px;">
                                    <option value="processing" <?php selected($trigger_status, 'processing'); ?>><?php _e('When Order is Processing (Paid)', 'invoiceai-sync'); ?></option>
                                    <option value="completed" <?php selected($trigger_status, 'completed'); ?>><?php _e('When Order is Completed', 'invoiceai-sync'); ?></option>
                                    <option value="any_paid" <?php selected($trigger_status, 'any_paid'); ?>><?php _e('Any Paid Status (Processing or Completed)', 'invoiceai-sync'); ?></option>
                                </select>
                                <p class="description" style="margin-top: 6px;">
                                    <?php _e('Determines when InvoiceAI creates and assigns the invoice to the customer.', 'invoiceai-sync'); ?>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><?php _e('Auto-Issue Invoices', 'invoiceai-sync'); ?></th>
                            <td>
                                <label>
                                    <input name="invoiceai_auto_issue" type="checkbox" value="yes" <?php checked($auto_issue, 'yes'); ?> />
                                    <?php _e('Automatically issue and certify invoices (generates permanent public viewing links and PDFs).', 'invoiceai-sync'); ?>
                                </label>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><?php _e('Email from InvoiceAI', 'invoiceai-sync'); ?></th>
                            <td>
                                <label>
                                    <input name="invoiceai_send_email" type="checkbox" value="yes" <?php checked($send_email, 'yes'); ?> />
                                    <?php _e('Have InvoiceAI send a dedicated branded invoice email in addition to WooCommerce order emails.', 'invoiceai-sync'); ?>
                                </label>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><?php _e('Customer PDF Button', 'invoiceai-sync'); ?></th>
                            <td>
                                <label>
                                    <input name="invoiceai_show_pdf_button" type="checkbox" value="yes" <?php checked($show_pdf_button, 'yes'); ?> />
                                    <?php _e('Display "Download Tax Invoice" button on Order Received thank-you page & customer account orders.', 'invoiceai-sync'); ?>
                                </label>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <?php submit_button(__('Save Integration Settings', 'invoiceai-sync'), 'primary', 'submit', false, array('style' => 'background: #4f46e5; border-color: #4338ca; height: 40px; padding: 0 24px; font-weight: 700; border-radius: 6px; font-size: 14px;')); ?>
                    </div>
                </form>
            </div>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $('#invoiceai_toggle_key').on('click', function() {
                var field = $('#invoiceai_api_key');
                if (field.attr('type') === 'password') {
                    field.attr('type', 'text');
                    $(this).text('Hide');
                } else {
                    field.attr('type', 'password');
                    $(this).text('Show');
                }
            });

            $('#invoiceai_test_btn').on('click', function(e) {
                e.preventDefault();
                var btn = $(this);
                var feedback = $('#invoiceai_test_feedback');
                var apiKey = $('#invoiceai_api_key').val().trim();
                var apiUrl = $('#invoiceai_api_url').val().trim();

                feedback.html('<span style="color: #64748b;">Testing connectivity...</span>');
                btn.prop('disabled', true);

                $.post(ajaxurl, {
                    action: 'invoiceai_test_connection',
                    security: '<?php echo wp_create_nonce('invoiceai_admin_nonce'); ?>',
                    api_key: apiKey,
                    api_url: apiUrl
                }, function(res) {
                    btn.prop('disabled', false);
                    if (res.success) {
                        feedback.html('<span style="color: #16a34a;">✅ ' + res.data.message + '</span>');
                    } else {
                        feedback.html('<span style="color: #dc2626;">❌ ' + res.data.message + '</span>');
                    }
                }).fail(function() {
                    btn.prop('disabled', false);
                    feedback.html('<span style="color: #dc2626;">❌ AJAX network error.</span>');
                });
            });
        });
        </script>
        <?php
    }

    public function add_order_metabox() {
        $screen = class_exists('\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController') 
            ? wc_get_page_screen_id('shop-order') 
            : 'shop_order';

        add_meta_box(
            'invoiceai_order_meta',
            __('InvoiceAI Tax Invoice', 'invoiceai-sync'),
            array($this, 'render_order_metabox'),
            $screen,
            'side',
            'high'
        );
    }

    public function render_order_metabox($post_or_order_object) {
        $order = ($post_or_order_object instanceof \WC_Order) 
            ? $post_or_order_object 
            : wc_get_order($post_or_order_object->ID);

        if (!$order) {
            echo '<p>' . __('Order not found.', 'invoiceai-sync') . '</p>';
            return;
        }

        $invoice_id     = $order->get_meta('_invoiceai_invoice_id');
        $invoice_number = $order->get_meta('_invoiceai_invoice_number');
        $public_url     = $order->get_meta('_invoiceai_public_url');

        if (!empty($invoice_number)) {
            ?>
            <div style="font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">
                    <strong><?php _e('Invoice #:', 'invoiceai-sync'); ?></strong> 
                    <code><?php echo esc_html($invoice_number); ?></code>
                </p>
                <p style="margin: 0 0 12px 0;">
                    <span style="display: inline-block; background: #ecfdf5; color: #047857; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                        <?php _e('SYNCED & ISSUED', 'invoiceai-sync'); ?>
                    </span>
                </p>
                <?php if (!empty($public_url)) : ?>
                    <a href="<?php echo esc_url($public_url); ?>" target="_blank" class="button button-primary" style="width: 100%; text-align: center; margin-bottom: 8px;">
                        <?php _e('View Invoice Online', 'invoiceai-sync'); ?> &rarr;
                    </a>
                <?php endif; ?>
            </div>
            <?php
        } else {
            ?>
            <div style="font-size: 13px;">
                <p style="color: #64748b; margin: 0 0 10px 0;">
                    <?php _e('No InvoiceAI invoice has been generated for this order yet.', 'invoiceai-sync'); ?>
                </p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="invoiceai_manual_sync" />
                    <input type="hidden" name="order_id" value="<?php echo esc_attr($order->get_id()); ?>" />
                    <?php wp_nonce_field('invoiceai_sync_order_' . $order->get_id()); ?>
                    <button type="submit" class="button button-secondary" style="width: 100%;">
                        <?php _e('Generate Invoice Now', 'invoiceai-sync'); ?>
                    </button>
                </form>
            </div>
            <?php
        }
    }

    public function handle_manual_sync() {
        if (!current_user_can('edit_shop_orders')) {
            wp_die(__('Unauthorized action.', 'invoiceai-sync'));
        }

        $order_id = isset($_POST['order_id']) ? absint($_POST['order_id']) : 0;
        check_admin_referer('invoiceai_sync_order_' . $order_id);

        $wc = new InvoiceAI_WooCommerce();
        $wc->sync_order_to_invoice($order_id, true);

        wp_safe_redirect(wp_get_referer() ?: admin_url('edit.php?post_type=shop_order'));
        exit;
    }
}
