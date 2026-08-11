import { z } from 'zod';

export const CreateTransferSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur.'),
  fromWarehouseId: z.string().min(1, 'Kaynak depo seçimi zorunludur.'),
  toWarehouseId: z.string().min(1, 'Hedef depo seçimi zorunludur.'),
  quantity: z.number().positive('Transfer miktarı sıfırdan büyük olmalıdır.'),
  notes: z.string().optional().nullable()
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Kaynak depo ile hedef depo aynı olamaz.',
  path: ['toWarehouseId']
});

export const UpdateShelfSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur.'),
  warehouseId: z.string().min(1, 'Depo seçimi zorunludur.'),
  rack: z.string().min(1, 'Raf/Konum kodu boş olamaz.').max(50, 'Konum kodu çok uzun.')
});

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;
export type UpdateShelfInput = z.infer<typeof UpdateShelfSchema>;
