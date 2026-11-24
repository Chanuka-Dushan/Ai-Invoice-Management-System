# InvoiceAI REST API Integration Guide

Welcome to the **InvoiceAI Developer API**. This API allows developers, SaaS applications, e-commerce platforms (WooCommerce, Shopify, Magento, custom web stores), and external CRMs to programmatically create invoices, sync customers, trigger PDF generation, send digital invoices via email, and record payments directly into an InvoiceAI tenant workspace.

---

## 1. Authentication & Security

InvoiceAI uses scoped API keys to authenticate external requests. Every API key is strictly tied to a single tenant organization (company), ensuring that data cannot leak across organizations.

### Authentication Headers

Include your API key in either of the following HTTP request headers:

```http
X-API-KEY: inv_live_YOUR_API_KEY
```

Or using standard Bearer authorization:

```http
Authorization: Bearer inv_live_YOUR_API_KEY
```

> **Security Note:** Never expose your API key in client-side code (vanilla frontend JS). Always make requests from your server-side backend or secured environment.

---

## 2. Base URL & Environments

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:4000/api/v1` |
| **Production SaaS** | `https://your-domain.com/api/v1` |

---

## 3. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ping` | Verify API key connectivity & return company details |
| `POST` | `/api/v1/invoices` | Create invoice, auto-match customer, and generate PDF links |
| `GET` | `/api/v1/invoices` | List invoices with pagination and search |
| `GET` | `/api/v1/invoices/:id` | Get single invoice details by ID or invoice number |
| `GET` | `/api/v1/invoices/:id/pdf` | Download raw PDF binary stream |
| `POST` | `/api/v1/invoices/:id/send` | Send invoice email to customer |
| `POST` | `/api/v1/invoices/:id/payments`| Record payment against an invoice |
| `GET` | `/api/v1/customers` | Query existing customers in the company |
| `POST` | `/api/v1/customers` | Create or update customer record |

---

## 4. Endpoints Reference

### 4.1 Ping & Verify Key
Test connectivity and retrieve authenticated business details.

- **Method:** `GET`
- **Path:** `/api/v1/ping`
- **Headers:** `X-API-KEY: inv_live_...`

**Sample Response (`200 OK`):**
```json
{
  "status": "ok",
  "message": "InvoiceAI API connectivity verified successfully",
  "timestamp": "2026-11-24T18:00:00.000Z",
  "company": {
    "id": "c1f72a4d-0123-4567-89ab-cdef01234567",
    "name": "Apex Digital Solutions (Pvt) Ltd",
    "email": "billing@apexdigital.com",
    "phone": "+94 11 234 5678",
    "currency": "LKR",
    "country": "Sri Lanka",
    "website": "https://apexdigital.com"
  }
}
```

---

### 4.2 Create Invoice
Creates an invoice for an order or transaction. If the customer does not exist, they are automatically created and assigned to your company.

- **Method:** `POST`
- **Path:** `/api/v1/invoices`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1 555 123 4567",
    "companyName": "Acme Global",
    "address": "123 Market St, Suite 400",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "United States"
  },
  "currency": "USD",
  "issueDate": "2026-11-24",
  "dueDate": "2026-12-08",
  "referenceNumber": "ORDER-98421",
  "items": [
    {
      "name": "Cloud Infrastructure Setup",
      "description": "AWS & Kubernetes Cluster Deployment",
      "quantity": 1,
      "unitPrice": 1500.00,
      "discountRate": 0,
      "taxRate": 10
    },
    {
      "name": "Priority Support SLA (Monthly)",
      "quantity": 2,
      "unitPrice": 250.00,
      "discountRate": 0,
      "taxRate": 10
    }
  ],
  "discountAmount": 100.00,
  "shippingAmount": 0.00,
  "notes": "Thank you for your business!",
  "autoIssue": true,
  "sendEmail": false
}
```

#### Field Explanations:
- `customer.email` *(optional)*: Used to find matching customer records. If found, the invoice is linked to them.
- `autoIssue` *(boolean, default: `true`)*:
  - When `true`, status is set to `ISSUED`, a permanent public token is generated, and customer PDF download links are activated immediately.
  - When `false`, status is `DRAFT` for review inside the web dashboard.
- `sendEmail` *(boolean, default: `false`)*: If set to `true`, InvoiceAI will immediately dispatch the branded invoice PDF email to `customer.email`.

**Sample Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "invoice": {
    "id": "f8a9e2d1-4433-2211-0011-abcdef123456",
    "invoiceNumber": "INV-2026-0042",
    "referenceNumber": "ORDER-98421",
    "status": "ISSUED",
    "currency": "USD",
    "subtotal": 2000.00,
    "discountAmount": 100.00,
    "taxAmount": 190.00,
    "shippingAmount": 0.00,
    "totalAmount": 2090.00,
    "paidAmount": 0.00,
    "outstandingBalance": 2090.00,
    "publicToken": "8b92d6e3-5339-4467-b5b4-d50d032df57d",
    "publicUrl": "http://localhost:5173/view-invoice/8b92d6e3-5339-4467-b5b4-d50d032df57d",
    "pdfDownloadUrl": "http://localhost:4000/api/v1/invoices/f8a9e2d1-4433-2211-0011-abcdef123456/pdf",
    "emailSent": false,
    "customer": {
      "id": "c9284210-9182-4112-9900-112233445566",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1 555 123 4567"
    },
    "createdAt": "2026-11-24T18:05:00.000Z"
  }
}
```

---

### 4.3 Download Invoice PDF
Streams the raw PDF binary file directly to your client or browser.

- **Method:** `GET`
- **Path:** `/api/v1/invoices/:id/pdf`
- **Headers:** `X-API-KEY: inv_live_...`
- **Response Headers:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="invoice-INV-2026-0042.pdf"`

---

### 4.4 Record Payment
Records a full or partial payment against an invoice. Updates the invoice balance and changes status to `PAID` or `PARTIALLY_PAID`.

- **Method:** `POST`
- **Path:** `/api/v1/invoices/:id/payments`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "amount": 2090.00,
  "paymentMethod": "ONLINE_GATEWAY",
  "transactionReference": "ch_3N8k2lKd90a1",
  "paymentDate": "2026-11-24",
  "notes": "Paid via Stripe Checkout"
}
```

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Payment of USD 2090 recorded successfully.",
  "paymentId": "p7291032-1111-2222-3333-444455556666",
  "invoiceNumber": "INV-2026-0042",
  "newStatus": "PAID",
  "paidAmount": 2090.00,
  "outstandingBalance": 0.00
}
```

---

## 5. Code Examples

### cURL
```bash
curl -X POST "http://localhost:4000/api/v1/invoices" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: inv_live_YOUR_API_KEY" \
  -d '{
    "customer": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "currency": "USD",
    "items": [
      {
        "name": "Annual Web Hosting",
        "quantity": 1,
        "unitPrice": 120.00,
        "taxRate": 0
      }
    ],
    "autoIssue": true
  }'
```

### Node.js / JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:4000/api/v1/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'inv_live_YOUR_API_KEY',
  },
  body: JSON.stringify({
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    currency: 'USD',
    items: [
      {
        name: 'Annual Web Hosting',
        quantity: 1,
        unitPrice: 120.0,
      },
    ],
    autoIssue: true,
  }),
});

const data = await response.json();
console.log('Invoice Created:', data.invoice.invoiceNumber);
console.log('Public URL:', data.invoice.publicUrl);
```

### PHP (cURL)
```php
<?php
$apiKey = 'inv_live_YOUR_API_KEY';
$apiUrl = 'http://localhost:4000/api/v1/invoices';

$data = [
    'customer' => [
        'name'  => 'Jane Smith',
        'email' => 'jane@example.com'
    ],
    'currency' => 'USD',
    'items' => [
        [
            'name'      => 'Annual Web Hosting',
            'quantity'  => 1,
            'unitPrice' => 120.00
        ]
    ],
    'autoIssue' => true
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-KEY: ' . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Invoice: " . $result['invoice']['invoiceNumber'];
?>
```

### Python (Requests)
```python
import requests

API_KEY = "inv_live_YOUR_API_KEY"
API_URL = "http://localhost:4000/api/v1/invoices"

headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY
}

payload = {
    "customer": {
        "name": "Jane Smith",
        "email": "jane@example.com"
    },
    "currency": "USD",
    "items": [
        {
            "name": "Annual Web Hosting",
            "quantity": 1,
            "unitPrice": 120.00
        }
    ],
    "autoIssue": True
}

res = requests.post(API_URL, json=payload, headers=headers)
print(res.json())
```

---

## 6. Error Codes

| Status Code | Reason | Resolution |
| :--- | :--- | :--- |
| `401 Unauthorized` | Missing or invalid API key | Verify key begins with `inv_live_` and passes in `X-API-KEY` header |
| `400 Bad Request` | Validation failure (missing items, bad email, negative numbers) | Check response payload for specific field error details |
| `404 Not Found` | Invoice or Company not found | Ensure ID or Invoice Number belongs to your company |
| `409 Conflict` | Invoice number already in use | Omit invoiceNumber to let InvoiceAI auto-increment sequentially |
