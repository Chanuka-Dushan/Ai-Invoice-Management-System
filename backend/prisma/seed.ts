import { PrismaClient, Role, CustomerType, InvoiceStatus, TemplateLayout, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial InvoiceAI database...');

  // Create Super Admin user
  const adminEmail = 'admin@invoiceai.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: 'Platform',
        lastName: 'SuperAdmin',
        phone: '+1 555 0199',
        isSuperAdmin: true,
      },
    });
    console.log('Created Super Admin user: admin@invoiceai.com / admin123');
  } else if (!adminUser.isSuperAdmin) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { isSuperAdmin: true },
    });
  }

  // Create demo user
  const email = 'demo@invoiceai.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'John',
        lastName: 'Perera',
        phone: '+94 77 123 4567',
      },
    });
    console.log('Created demo user: demo@invoiceai.com / password123');
  }

  // Create Company
  let company = await prisma.company.findFirst({
    where: { members: { some: { userId: user.id } } },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Apex Digital Solutions',
        slug: 'apex-digital-solutions',
        email: 'billing@apexdigital.com',
        phone: '+94 11 234 5678',
        website: 'https://apexdigital.example.com',
        businessRegNumber: 'PV-98234-LK',
        taxNumber: 'TIN-40912830',
        address1: 'Level 14, Orion City',
        address2: '752 Dr Danister De Silva Mawatha',
        city: 'Colombo',
        state: 'Western Province',
        postalCode: '00900',
        country: 'Sri Lanka',
        defaultCurrency: 'USD',
        brandColor: '#1e3a8a',
        bankDetails: 'Commercial Bank of Ceylon\nAccount Name: Apex Digital Solutions (Pvt) Ltd\nAccount No: 1000 8945 1209\nBranch: City Office Colombo\nSWIFT: CCEYLKLX',
        defaultPaymentTerms: 'Payment due within 14 days of invoice date. Late payments subject to a 2% monthly fee.',
        defaultInvoiceFooter: 'Thank you for partnering with Apex Digital Solutions. We appreciate your business!',
        members: {
          create: {
            userId: user.id,
            role: Role.OWNER,
          },
        },
      },
    });
    console.log('Created company: Apex Digital Solutions');
  }

  // Seed Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-abc-tech' },
    update: {},
    create: {
      id: 'cust-abc-tech',
      companyId: company.id,
      name: 'ABC Technologies Inc',
      companyName: 'ABC Technologies',
      email: 'finance@abctech.io',
      phone: '+1 415 555 0192',
      address1: '500 Howard Street, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
      taxId: 'US-EIN-9283411',
      type: CustomerType.BUSINESS,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cust-nexora' },
    update: {},
    create: {
      id: 'cust-nexora',
      companyId: company.id,
      name: 'Nexora Media Group',
      companyName: 'Nexora Media',
      email: 'accounts@nexoramedia.com',
      phone: '+44 20 7946 0912',
      address1: '100 Bishopsgate',
      city: 'London',
      postalCode: 'EC2N 4AG',
      country: 'United Kingdom',
      type: CustomerType.BUSINESS,
    },
  });

  // Seed Suppliers
  await prisma.supplier.upsert({
    where: { id: 'sup-aws-cloud' },
    update: {},
    create: {
      id: 'sup-aws-cloud',
      companyId: company.id,
      name: 'Amazon Web Services',
      contactPerson: 'AWS Billing',
      email: 'aws-billing@amazon.com',
      address: '410 Terry Ave N, Seattle, WA 98109',
      taxId: 'US-91-1646860',
    },
  });

  await prisma.supplier.upsert({
    where: { id: 'sup-figma' },
    update: {},
    create: {
      id: 'sup-figma',
      companyId: company.id,
      name: 'Figma Inc',
      contactPerson: 'Subscription Accounts',
      email: 'billing@figma.com',
      address: '768 Market St, San Francisco, CA 94102',
    },
  });

  // Seed Products
  const prod1 = await prisma.product.upsert({
    where: { id: 'prod-web-dev' },
    update: {},
    create: {
      id: 'prod-web-dev',
      companyId: company.id,
      name: 'Full-Stack Web Development',
      description: 'End-to-end modern web application architecture and engineering',
      sku: 'DEV-FULLSTACK',
      unitPrice: 120.0,
      taxRate: 0,
      unit: 'hrs',
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { id: 'prod-uiux-design' },
    update: {},
    create: {
      id: 'prod-uiux-design',
      companyId: company.id,
      name: 'UI/UX Design & Prototyping',
      description: 'Design system creation, interactive wireframing, user testing',
      sku: 'DSGN-UIUX',
      unitPrice: 95.0,
      taxRate: 0,
      unit: 'hrs',
    },
  });

  // Seed sample Invoices
  const inv1 = await prisma.invoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: 'INV-2026-0001' } },
    update: {},
    create: {
      companyId: company.id,
      customerId: customer1.id,
      invoiceNumber: 'INV-2026-0001',
      issueDate: new Date('2026-10-15'),
      dueDate: new Date('2026-10-29'),
      currency: 'USD',
      status: InvoiceStatus.PAID,
      subtotal: 4800.0,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      discountAmount: 480.0,
      taxAmount: 0,
      totalAmount: 4320.0,
      paidAmount: 4320.0,
      outstandingBalance: 0,
      templateName: TemplateLayout.MODERN,
      items: {
        create: [
          {
            name: 'Full-Stack Web Development',
            description: '40 hours of frontend React and backend microservice implementation',
            quantity: 40,
            unitPrice: 120,
            discountRate: 0,
            taxRate: 0,
            lineTotal: 4800,
          },
        ],
      },
      payments: {
        create: {
          companyId: company.id,
          amount: 4320.0,
          currency: 'USD',
          paymentDate: new Date('2026-10-25'),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: 'WIRE-9923841-OCT',
          status: PaymentStatus.COMPLETED,
        },
      },
    },
  });

  const inv2 = await prisma.invoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: 'INV-2026-0002' } },
    update: {},
    create: {
      companyId: company.id,
      customerId: customer2.id,
      invoiceNumber: 'INV-2026-0002',
      issueDate: new Date('2026-11-01'),
      dueDate: new Date('2026-11-15'),
      currency: 'USD',
      status: InvoiceStatus.ISSUED,
      subtotal: 3800.0,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 3800.0,
      paidAmount: 0,
      outstandingBalance: 3800.0,
      templateName: TemplateLayout.CORPORATE,
      items: {
        create: [
          {
            name: 'UI/UX Design & Prototyping',
            description: 'Design system and high-fidelity interactive prototype for marketing launch',
            quantity: 40,
            unitPrice: 95,
            discountRate: 0,
            taxRate: 0,
            lineTotal: 3800,
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

