export interface TastingRoomLocation {
  id: string;
  city: "İstanbul" | "Londra" | "Paris";
  name: string;
  address: string;
  image: string;
  availableTimes: string[];
  maxCapacity: number;
  experienceName: string;
  pricePerPerson: number;
}

export interface TastingReservationRequest {
  locationId: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
}
