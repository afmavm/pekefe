import { z } from 'zod';

export const CreateProductionOrderSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi zorunludur.'),
  productVariantId: z.string().nullable().optional(),
  quantity: z.number().positive('Miktar sıfırdan büyük olmalıdır.'),
  warehouseId: z.string().nullable().optional(),
  productionPlanId: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateProductionOrderInput = z.infer<typeof CreateProductionOrderSchema>;
