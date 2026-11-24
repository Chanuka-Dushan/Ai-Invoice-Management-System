<?php
/**
 * InvoiceAI API Client
 *
 * @package InvoiceAI_Sync
 */

if (!defined('ABSPATH')) {
    exit;
}

class InvoiceAI_API {
    private $api_url;
    private $api_key;

    public function __construct() {
        $this->api_url = untrailingslashit(get_option('invoiceai_api_url', 'http://localhost:4000/api/v1'));
        $this->api_key = get_option('invoiceai_api_key', '');
    }

    /**
     * Send HTTP request to InvoiceAI
     */
    private function request($endpoint, $method = 'GET', $body = null) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('InvoiceAI API Key is not configured.', 'invoiceai-sync'));
        }

        $url = $this->api_url . '/' . ltrim($endpoint, '/');

        $args = array(
            'method'  => $method,
            'timeout' => 20,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-KEY'    => $this->api_key,
                'User-Agent'   => 'InvoiceAI-WordPress-Sync/1.0.0 (WordPress/' . get_bloginfo('version') . ')',
            ),
        );

        if (!empty($body) && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $raw_body    = wp_remote_retrieve_body($response);
        $data        = json_decode($raw_body, true);

        if ($status_code >= 400) {
            $message = isset($data['message']) 
                ? (is_array($data['message']) ? implode(', ', $data['message']) : $data['message']) 
                : 'API Error: HTTP ' . $status_code;
            return new WP_Error('api_error_' . $status_code, $message, $data);
        }

        return $data;
    }

    /**
     * Test connection to InvoiceAI
     */
    public function ping() {
        return $this->request('ping', 'GET');
    }

    /**
     * Create an Invoice in InvoiceAI
     */
    public function create_invoice($payload) {
        return $this->request('invoices', 'POST', $payload);
    }

    /**
     * Get Invoice details
     */
    public function get_invoice($id_or_number) {
        return $this->request('invoices/' . rawurlencode($id_or_number), 'GET');
    }

    /**
     * Record a payment against an invoice
     */
    public function record_payment($id_or_number, $payment_data) {
        return $this->request('invoices/' . rawurlencode($id_or_number) . '/payments', 'POST', $payment_data);
    }

    /**
     * Get download URL for invoice PDF
     */
    public function get_pdf_download_url($invoice_id) {
        return $this->api_url . '/invoices/' . rawurlencode($invoice_id) . '/pdf';
    }
}
