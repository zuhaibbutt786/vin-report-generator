/** Normalized vehicle report data model */

export type FieldStatus = "available" | "not_available" | "estimated" | "user_entered" | "source_unavailable";

export interface DataField<T = string> {
  value?: T;
  status: FieldStatus;
  source?: string;
}

export interface DataSource {
  name: string;
  url?: string;
  retrievedAt: string;
  fieldsProvided: string[];
  success: boolean;
  error?: string;
}

export interface RecallItem {
  campaignNumber: string;
  manufacturer?: string;
  component?: string;
  summary?: string;
  consequence?: string;
  remedy?: string;
  notes?: string;
  reportDate?: string;
  parkIt?: boolean;
  parkOutSide?: boolean;
  overTheAirUpdate?: boolean;
}

export interface InspectionCondition {
  overall: "excellent" | "very_good" | "good" | "fair" | "poor" | "not_assessed";
  exterior: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  interior: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  engine: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  transmission: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  electrical: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  tires: "excellent" | "good" | "fair" | "poor" | "not_inspected";
  brakes: "excellent" | "good" | "fair" | "poor" | "not_inspected";
}

export interface PhotoEntry {
  id: string;
  label: string;
  dataUrl: string;
  addedAt: string;
}

export interface ManualData {
  clientName?: string;
  clientReference?: string;
  registration?: string;
  mileage?: string;
  purchasePrice?: string;
  inspectionDate?: string;
  inspectorName?: string;
  notes?: string;
  additionalFindings?: string;
  vehicleCondition?: string;
  accidentInfo?: string;
  auctionInfo?: string;
  condition: InspectionCondition;
  photos: PhotoEntry[];
}

export interface VehicleIdentification {
  make?: string;
  manufacturer?: string;
  model?: string;
  modelYear?: string;
  trim?: string;
  series?: string;
  vehicleType?: string;
  bodyClass?: string;
  vehicleClass?: string;
}

export interface EngineInfo {
  engineModel?: string;
  displacement?: string;
  cylinders?: string;
  fuelType?: string;
  configuration?: string;
  horsepower?: string;
  manufacturer?: string;
}

export interface DrivetrainInfo {
  transmission?: string;
  transmissionSpeeds?: string;
  driveType?: string;
}

export interface DimensionsInfo {
  doors?: string;
  seats?: string;
  gvwr?: string;
  bedType?: string;
}

export interface ManufacturingInfo {
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  plantCompany?: string;
  region?: string;
}

export interface VehicleReport {
  id: string;
  vin: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  identification: VehicleIdentification;
  engine: EngineInfo;
  drivetrain: DrivetrainInfo;
  dimensions: DimensionsInfo;
  manufacturing: ManufacturingInfo;
  safety: {
    recalls: RecallItem[];
    recallsAvailable: boolean;
    recallsNote?: string;
  };
  rawVpic?: Record<string, string>;
  sources: DataSource[];
  dataCompleteness: number;
  manual: ManualData;
  wmi?: {
    code: string;
    manufacturer?: string;
    country?: string;
    region?: string;
  };
}

export interface BrandingSettings {
  name: string;
  company: string;
  logoDataUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  reportFooter: string;
  disclaimer: string;
  defaultReportTitle: string;
}

export interface StoredReportMeta {
  id: string;
  vin: string;
  vehicleLabel: string;
  createdAt: string;
  updatedAt: string;
}
