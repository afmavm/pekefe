export interface Integration {
  id: string;
  name: string;
  type: string;
  status: string; // "ACTIVE" | "INACTIVE"
  lastSync: string | null;
  logo: string;
  settings: IntegrationSettings;
}

export interface IntegrationSettings {
  apiKey?: string;
  secretKey?: string;
  sellerId?: string;
  autoSync?: boolean;
  autoPriceSync?: boolean;
  [key: string]: any;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  time: string;
  message: string;
  status: 'ok' | 'err' | 'info';
  createdAt: Date;
}
