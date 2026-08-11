import { z } from "zod";

export const JournalLineInputSchema = z.object({
  debitAccountId: z.string().min(1, "Borç hesabı seçilmelidir."),
  creditAccountId: z.string().min(1, "Alacak hesabı seçilmelidir."),
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalıdır."),
  description: z.string().optional().nullable(),
});

export const CreateJournalEntrySchema = z.object({
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır."),
  date: z.coerce.date().default(() => new Date()),
  type: z.string().default("GENERAL"),
  lines: z.array(JournalLineInputSchema).min(1, "En az bir yevmiye satırı eklenmelidir."),
}).refine((data) => {
  // Enforce double entry check if lines are arbitrary (though in our lines schema, 
  // each line has a debit and credit, meaning individual lines are balanced.
  // We will check that for every line, debitAccountId !== creditAccountId)
  return data.lines.every(line => line.debitAccountId !== line.creditAccountId);
}, {
  message: "Borç ve alacak hesapları aynı olamaz.",
  path: ["lines"],
});

export const BankTransferSchema = z.object({
  fromBankId: z.string().min(1, "Kaynak banka hesabı seçilmelidir."),
  toBankId: z.string().min(1, "Hedef banka hesabı seçilmelidir."),
  amount: z.coerce.number().positive("Transfer tutarı sıfırdan büyük olmalıdır."),
  description: z.string().optional().nullable(),
}).refine((data) => data.fromBankId !== data.toBankId, {
  message: "Kaynak ve hedef banka hesabı aynı olamaz.",
  path: ["toBankId"],
});

export const TaxDeclarationSchema = z.object({
  period: z.string().regex(/^\d{4}\/\d{2}$/, "Dönem formatı YYYY/AA olmalıdır (örn: 2026/05)."),
  type: z.string().min(2, "Vergi türü seçilmelidir."),
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalıdır."),
  taxBase: z.coerce.number().nonnegative("Matrah sıfırdan küçük olamaz.").optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100, "Vergi oranı %100'den büyük olamaz.").optional().nullable(),
  dueDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
export type BankTransferInput = z.infer<typeof BankTransferSchema>;
export type TaxDeclarationInput = z.infer<typeof TaxDeclarationSchema>;
