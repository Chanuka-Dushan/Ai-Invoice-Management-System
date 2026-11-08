export type Role = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'STAFF';

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

export type IncomingInvoiceStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type TemplateLayout = 'MODERN' | 'MINIMAL' | 'CORPORATE' | 'CREATIVE';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'CREDIT_CARD'
  | 'ONLINE_GATEWAY'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
  isActive?: boolean;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  businessRegNumber?: string | null;
  taxNumber?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  defaultCurrency: string;
  defaultPaymentTerms?: string | null;
  bankDetails?: string | null;
  defaultInvoiceFooter?: string | null;
  brandColor: string;
  isActive?: boolean;
  role?: Role;
}

export interface PlatformStats {
  totalCompanies: number;
  totalUsers: number;
  totalInvoices: number;
  totalCustomers: number;
  totalVolume: number;
  totalCollected: number;
  statusCounts: Record<string, number>;
  recentCompanies: Array<{
    id: string;
    name: string;
    email: string;
    membersCount: number;
    invoicesCount: number;
    isActive: boolean;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface PlatformCompany {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  defaultCurrency: string;
  brandColor: string;
  isActive: boolean;
  createdAt: string;
  owner?: { id: string; firstName: string; lastName: string; email: string } | null;
  stats: {
    membersCount: number;
    invoicesCount: number;
    customersCount: number;
  };
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  companies: Array<{
    companyId: string;
    companyName: string;
    role: Role;
  }>;
}

export interface PlatformAuditLog {
  id: string;
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  company?: { name: string } | null;
  user?: { email: string; firstName: string; lastName: string } | null;
}

export interface Customer {
  id: string;
  companyId: string;
  type: CustomerType;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxId?: string | null;
  notes?: string | null;
  totalInvoiced?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  invoiceCount?: number;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  totalExpenses?: number;
  totalPaid?: number;
  outstanding?: number;
  invoiceCount?: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  unitPrice: number;
  taxRate: number;
  unit: string;
}

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  productId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  lineTotal: number;
  sortOrder?: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  referenceNumber?: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: InvoiceStatus;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  paymentInstructions?: string | null;
  templateName: TemplateLayout;
  isAiGenerated: boolean;
  aiPromptUsed?: string | null;
  publicToken: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  company?: Company;
  items: InvoiceItem[];
  payments?: Payment[];
}

export interface IncomingInvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface IncomingInvoice {
  id: string;
  companyId: string;
  supplierId?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: IncomingInvoiceStatus;
  ocrRawText?: string | null;
  aiExtractionConfidence: number;
  filePath?: string | null;
  notes?: string | null;
  createdAt: string;
  supplier?: Supplier | null;
  items: IncomingInvoiceItem[];
}

export interface Payment {
  id: string;
  companyId: string;
  invoiceId?: string | null;
  incomingInvoiceId?: string | null;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: InvoiceStatus;
    customer?: { name: string; companyName?: string };
  };
}

export interface DashboardMetrics {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoices: number;
    paidInvoicesCount: number;
    unpaidInvoicesCount: number;
    overdueInvoicesCount: number;
    outstandingBalance: number;
  };
  recentInvoices: Invoice[];
  recentPayments: Payment[];
  monthlyChart: Array<{
    month: string;
    revenue: number;
    expense: number;
  }>;
}

