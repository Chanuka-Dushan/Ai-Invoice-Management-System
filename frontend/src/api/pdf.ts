import { apiClient, API_BASE_URL } from './client';

export const downloadInvoicePdf = async (invoiceId: string, invoiceNumber?: string) => {
  try {
    const res = await apiClient.get(`/pdf/invoices/${invoiceId}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fileUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `${invoiceNumber || `invoice-${invoiceId.slice(0, 8)}`}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(fileUrl), 2000);
  } catch (err) {
    console.error('Direct blob download error:', err);
    window.open(`${API_BASE_URL}/pdf/invoices/${invoiceId}`, '_blank');
  }
};

export const viewInvoicePdf = async (invoiceId: string) => {
  try {
    const res = await apiClient.get(`/pdf/invoices/${invoiceId}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fileUrl = window.URL.createObjectURL(blob);
    window.open(fileUrl, '_blank');
  } catch (err) {
    console.error('Direct blob view error:', err);
    window.open(`${API_BASE_URL}/pdf/invoices/${invoiceId}`, '_blank');
  }
};
