<?php
/**
 * Plugin Name:       InvoiceAI Sync for WooCommerce
 * Plugin URI:        https://invoiceai.com/integrations/wordpress
 * Description:       Automate professional PDF tax invoices, multi-tenant customer sync, and instant customer download buttons for WooCommerce orders powered by InvoiceAI.
 * Version:           1.0.0
 * Requires at least: 5.6
 * Requires PHP:      7.4
 * Author:            InvoiceAI
 * Author URI:        https://invoiceai.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       invoiceai-sync
 * Domain Path:       /languages
 * WC requires at least: 4.0
 * WC tested up to:      9.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('INVOICEAI_VERSION', '1.0.0');
define('INVOICEAI_PLUGIN_FILE', __FILE__);
define('INVOICEAI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('INVOICEAI_PLUGIN_URL', plugin_dir_url(__FILE__));

// Declare HPOS (High-Performance Order Storage) Compatibility for WooCommerce
add_action('before_woocommerce_init', function() {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

// Load Core Components
require_once INVOICEAI_PLUGIN_DIR . 'includes/class-invoiceai-api.php';
require_once INVOICEAI_PLUGIN_DIR . 'includes/class-invoiceai-admin.php';
require_once INVOICEAI_PLUGIN_DIR . 'includes/class-invoiceai-woocommerce.php';

function invoiceai_init_plugin() {
    new InvoiceAI_Admin();
    new InvoiceAI_WooCommerce();
}
add_action('plugins_loaded', 'invoiceai_init_plugin');

// Add Settings Link to Plugins table
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function($links) {
    $settings_link = '<a href="' . admin_url('admin.php?page=invoiceai-settings') . '">' . __('Settings', 'invoiceai-sync') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
});
