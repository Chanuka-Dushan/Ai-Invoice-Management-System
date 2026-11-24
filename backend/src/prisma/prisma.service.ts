import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 5;
    const retryDelayMs = 2500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully to ' + (process.env.DATABASE_URL?.split('@')[1] || 'localhost'));
        return;
      } catch (err: any) {
        if (attempt === maxRetries) {
          this.logger.error(
            `Unable to connect to database at localhost:3306 after ${maxRetries} attempts.\n` +
            `Troubleshooting steps:\n` +
            `  1. Ensure WampServer or MySQL is running (Start-Service wampmysqld64 or start WampServer icon in system tray).\n` +
            `  2. Check if port 3306 is listening: run 'netstat -ano | findstr 3306'.\n` +
            `  3. Verify DATABASE_URL in backend/.env: ${process.env.DATABASE_URL}\n`,
          );
          throw err;
        }

        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${retryDelayMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
