export interface LabAnalysis {
  c4SugarTest: string; // e.g. "%0.00 (Tamamen Doğal)"
  propolisRating: string; // e.g. "98.4 / 100"
  diastaseValue: string; // e.g. "24.2 (Yüksek Doğan Aktivite)"
  moistureRate: string; // e.g. "%16.2"
  pollenCount: string; // e.g. "450+ Endemik Tür"
}

export interface HarvestGPS {
  latitude: number;
  longitude: number;
  locationName: string;
  altitudeMeters: number;
  producerName: string;
}

export interface ProvenanceRecord {
  verificationCode: string;
  nftTokenId: string;
  blockHash: string;
  blockNumber: number;
  timestamp: string;
  productName: string;
  batchNumber: string;
  rekolteYear: number;
  totalJarsInBatch: number;
  jarNumber: number;
  labAnalysis: LabAnalysis;
  gps: HarvestGPS;
  certifier: string;
  blockchainNetwork: string;
}
