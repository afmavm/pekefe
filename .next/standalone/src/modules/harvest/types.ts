export interface HarvestBatch {
  id: string;
  title: string;
  subtitle: string;
  rekolteYear: number;
  originVillage: string;
  altitude: string;
  maxQuota: number;
  reservedQuota: number;
  bottlingDate: string;
  pricePerUnit: number;
  unitVolume: string;
  image: string;
  storyContent: string;
  flavorNotes: string[];
  isActive: boolean;
}

export interface HarvestPreOrderRequest {
  batchId: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  notes?: string;
}

export interface HarvestPreOrderResponse {
  success: boolean;
  reservationCode?: string;
  message: string;
}
