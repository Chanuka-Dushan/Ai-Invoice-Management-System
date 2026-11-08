import { PrismaClient } from '@prisma/client';

async function runOverdueInvoiceJob() {
  const prisma = new PrismaClient();
  const now = new Date();

  console.log(`[InvoiceAI Cron Job] Starting automated overdue check at ${now.toISOString()}...`);

  try {
    // 1. Find all issued invoices where dueDate is strictly past now
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        invoiceNumber: true,
        companyId: true,
        dueDate: true,
        totalAmount: true,
        outstandingBalance: true,
      },
    });

    console.log(`[InvoiceAI Cron Job] Found ${overdueInvoices.length} invoices to transition to OVERDUE.`);

    let updatedCount = 0;
    for (const inv of overdueInvoices) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' },
      });

      await prisma.auditLog.create({
        data: {
          companyId: inv.companyId,
          action: 'INVOICE_AUTO_OVERDUE',
          entityType: 'Invoice',
          entityId: inv.id,
          detailsJson: JSON.stringify({
            invoiceNumber: inv.invoiceNumber,
            dueDate: inv.dueDate,
            outstandingBalance: inv.outstandingBalance,
            reason: 'cPanel scheduled cron check transitioned past due invoice to OVERDUE',
          }),
        },
      });

      updatedCount++;
    }

    console.log(`[InvoiceAI Cron Job] Successfully marked ${updatedCount} invoices as OVERDUE.`);
  } catch (error) {
    console.error('[InvoiceAI Cron Job] Error executing overdue check:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('[InvoiceAI Cron Job] Completed job execution.');
  }
}

runOverdueInvoiceJob();

