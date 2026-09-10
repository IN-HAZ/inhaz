export interface StopItem {
  type: 'PICKUP' | 'DESTINATION';
  address: string;
  contact_name: string;
  contact_phone: string;
  latitude?: number;
  longitude?: number;
  /** True while a GPS/geocode operation is in progress for this stop */
  isLocating?: boolean;
}

export interface PhotoItem {
  id: string;
  uri: string;
  fileName: string;
  photoKey?: string;
  status: 'selected' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
}

export interface VehicleOption {
  id: string;
  label: string;
  sub: string;
  icon: any;
}
