import { PrismaService } from '../../prisma/prisma.service';

export async function generateNextInvoiceNumber(
  prisma: PrismaService,
  companyId: string,
  prefix = 'INV',
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPattern = `${prefix}-${currentYear}-%`;

  // Find the invoice with the highest number for this company and year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      companyId,
      invoiceNumber: {
        startsWith: `${prefix}-${currentYear}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('-');
    if (parts.length >= 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedSequence}`;
}

