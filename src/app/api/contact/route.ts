import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailNotificationService } from '@/lib/email-notification-service';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().optional().nullable(),
  subject: z.string(),
  message: z.string().min(5, "Mesaj en az 5 karakter olmalıdır"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ContactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, email, phone, subject, message } = result.data;

    const subjectMap: Record<string, string> = {
      siparis: "Sipariş Hakkında",
      toplu: "Toplu / Toptancı Sipariş",
      bayi: "Bayi Başvurusu",
      teknik: "Teknik Destek",
      diger: "Diğer",
    };
    const mappedSubject = subjectMap[subject] || subject;
    const ticketSubject = `[İletişim Formu] ${mappedSubject}`;

    const ticket = await prisma.ticket.create({
      data: {
        email,
        subject: ticketSubject,
        category: "GENERAL",
        status: "ACIK", // Use "ACIK" to show up as Open in the admin panel
        messages: {
          create: {
            sender: "USER",
            message: `Gönderen: ${name}\nTelefon: ${phone || 'Belirtilmedi'}\n\nMesaj:\n${message}`,
          },
        },
      },
    });

    // Müşteriye alındı bilgisi ve yöneticiye iletişim bildirimi gönder
    const nowStr = new Date().toLocaleString("tr-TR");
    emailNotificationService
      .queueEmail(email, "contact_received", {
        kullanici_adi: name,
        konu: mappedSubject,
        tarih: nowStr,
      })
      .catch(() => {});

    const adminEmail = emailNotificationService.getAdminEmail();
    if (adminEmail) {
      emailNotificationService
        .queueEmail(adminEmail, "admin_contact_message", {
          kullanici_adi: name,
          eposta: email,
          telefon: phone || "Belirtilmedi",
          konu: mappedSubject,
          mesaj: message,
          tarih: nowStr,
        })
        .catch(() => {});
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
