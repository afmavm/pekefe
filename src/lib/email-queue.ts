import { prisma } from './prisma';
import nodemailer from 'nodemailer';

interface QueueItem {
  id: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  eventType?: string;
  retryCount: number;
}

class EmailQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private get maxRetries(): number {
    return Number(process.env.SMTP_MAX_RETRIES) || 3;
  }

  constructor() {
    // Build aşamasında Prisma çağrısı yapma
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      this.resumePendingLogs();
    }
  }

  private async resumePendingLogs() {
    try {
      const pendingLogs = await prisma.emailLog.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
      });
      for (const log of pendingLogs) {
        this.queue.push({
          id: log.id,
          recipient: log.recipient,
          subject: log.subject,
          bodyHtml: log.bodyHtml,
          eventType: log.eventType || undefined,
          retryCount: log.retryCount
        });
      }
      if (this.queue.length > 0) {
        this.processQueue();
      }
    } catch (err) {
      console.error('[EMAIL QUEUE] Failed to resume pending logs:', err);
    }
  }

  public async addToQueue(recipient: string, subject: string, bodyHtml: string, eventType?: string) {
    const log = await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        bodyHtml,
        eventType,
        status: 'PENDING',
        retryCount: 0
      }
    });

    this.queue.push({
      id: log.id,
      recipient,
      subject,
      bodyHtml,
      eventType,
      retryCount: 0
    });

    await this.processQueue();
    return log.id;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        await this.sendMail(item);
        await prisma.emailLog.update({
          where: { id: item.id },
          data: { status: 'SUCCESS' }
        });
      } catch (error: any) {
        console.error(`[EMAIL QUEUE] Error sending email to ${item.recipient}:`, error);
        const nextRetry = item.retryCount + 1;
        if (nextRetry >= this.maxRetries) {
          await prisma.emailLog.update({
            where: { id: item.id },
            data: {
              status: 'FAILED',
              errorMessage: error?.message || String(error),
              retryCount: nextRetry
            }
          });
        } else {
          item.retryCount = nextRetry;
          await prisma.emailLog.update({
            where: { id: item.id },
            data: {
              retryCount: nextRetry,
              errorMessage: error?.message || String(error)
            }
          });
          this.queue.push(item);
           const delaySec = Number(process.env.SMTP_RETRY_DELAY) || 5;
          await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
        }
      }
    }

    this.isProcessing = false;
  }

  private async sendMail(item: QueueItem): Promise<void> {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || user === 'test@example.com') {
      console.log(`[EMAIL_MOCK] [EVENT: ${item.eventType || 'NONE'}]
To: ${item.recipient}
Subject: ${item.subject}
Body snippet: ${item.bodyHtml.substring(0, 150)}...`);
      await new Promise(r => setTimeout(r, 1000));
      return;
    }

    const secureVal = process.env.SMTP_SECURE;
    const isSecure = secureVal ? secureVal === "true" : (port === 465);
    const fromName = process.env.SMTP_FROM_NAME || "Atak Arıcılık B2B";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: item.recipient,
      subject: item.subject,
      html: item.bodyHtml
    });
  }
}

const globalForEmailQueue = globalThis as unknown as {
  emailQueueInstance: EmailQueue | undefined;
};

export const emailQueue = globalForEmailQueue.emailQueueInstance ?? new EmailQueue();

if (process.env.NODE_ENV !== 'production') {
  globalForEmailQueue.emailQueueInstance = emailQueue;
}
