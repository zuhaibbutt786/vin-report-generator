import { decodeVIN } from "../api/vpic";
import { fetchRecalls } from "../api/recalls";
import type { VehicleReport, DataSource, ManualData } from "../types";
import { getYearCode } from "../vin/validate";
import wmiData from "../../data/wmi.json";

type WmiEntry = { manufacturer?: string; country?: string; region?: string };

function lookupWmi(vin: string): VehicleReport["wmi"] {
  const code3 = vin.slice(0, 3);
  const code4 = vin.slice(0, 4);
  const data = wmiData as Record<string, WmiEntry>;
  const entry = data[code4] || data[code3];
  if (!entry) {
    return { code: code3 };
  }
  return {
    code: data[code4] ? code4 : code3,
    manufacturer: entry.manufacturer,
    country: entry.country,
    region: entry.region,
  };
}

function emptyManual(): ManualData {
  return {
    condition: {
      overall: "not_assessed",
      exterior: "not_inspected",
      interior: "not_inspected",
      engine: "not_inspected",
      transmission: "not_inspected",
      electrical: "not_inspected",
      tires: "not_inspected",
      brakes: "not_inspected",
    },
    photos: [],
  };
}

function calcCompleteness(report: Partial<VehicleReport>): number {
  const fields = [
    report.identification?.make,
    report.identification?.model,
    report.identification?.modelYear,
    report.identification?.trim,
    report.identification?.bodyClass,
    report.engine?.displacement,
    report.engine?.cylinders,
    report.engine?.fuelType,
    report.drivetrain?.driveType,
    report.dimensions?.doors,
    report.manufacturing?.plantCountry,
    report.manufacturing?.plantCity,
  ];
  const filled = fields.filter((v) => v && String(v).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function generateReportId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `VR-${y}${m}${d}-${seq}`;
}

export async function buildReportFromVin(vin: string): Promise<{
  report: VehicleReport;
  errors: string[];
}> {
  const errors: string[] = [];
  const sources: DataSource[] = [];
  const now = new Date().toISOString();

  const wmi = lookupWmi(vin);

  const vpic = await decodeVIN(vin);
  sources.push({
    name: "NHTSA vPIC",
    url: "https://vpic.nhtsa.dot.gov/api/",
    retrievedAt: now,
    fieldsProvided: vpic.success ? Object.keys(vpic.data) : [],
    success: vpic.success,
    error: vpic.error,
  });

  if (!vpic.success && vpic.error) {
    errors.push(vpic.error);
  }

  const d = vpic.data;

  const report: VehicleReport = {
    id: generateReportId(),
    vin,
    createdAt: now,
    updatedAt: now,
    identification: {
      make: d.Make || undefined,
      manufacturer: d.Manufacturer || d.Make || undefined,
      model: d.Model || undefined,
      modelYear: d.ModelYear || (getYearCode(vin)?.toString() ?? undefined),
      trim: d.Trim || undefined,
      series: d.Series || undefined,
      vehicleType: d.VehicleType || undefined,
      bodyClass: d.BodyClass || undefined,
      vehicleClass: d.VehicleClass || undefined,
    },
    engine: {
      engineModel: d.EngineModel || undefined,
      displacement: d.DisplacementL
        ? `${d.DisplacementL} L`
        : d.DisplacementCC
          ? `${d.DisplacementCC} cc`
          : undefined,
      cylinders: d.EngineCylinders || undefined,
      fuelType: d.FuelTypePrimary || undefined,
      configuration: d.EngineConfiguration || undefined,
      horsepower: d.EngineHP || undefined,
      manufacturer: d.EngineManufacturer || undefined,
    },
    drivetrain: {
      transmission: d.TransmissionStyle || d.Transmission || undefined,
      transmissionSpeeds: d.TransmissionSpeeds || undefined,
      driveType: d.DriveType || undefined,
    },
    dimensions: {
      doors: d.Doors || undefined,
      seats: d.Seats || d.SeatRows || undefined,
      gvwr: d.GVWR || d.GrossVehicleWeightRatingFrom || undefined,
      bedType: d.BedType || undefined,
    },
    manufacturing: {
      plantCountry: d.PlantCountry || wmi?.country || undefined,
      plantState: d.PlantState || undefined,
      plantCity: d.PlantCity || undefined,
      plantCompany: d.PlantCompanyName || undefined,
      region: wmi?.region || undefined,
    },
    safety: {
      recalls: [],
      recallsAvailable: false,
      recallsNote: "Recall information was not available from the connected free source.",
    },
    rawVpic: d,
    sources,
    dataCompleteness: 0,
    manual: emptyManual(),
    wmi,
  };

  const make = report.identification.make;
  const model = report.identification.model;
  const year = report.identification.modelYear;

  if (make && model && year) {
    const recalls = await fetchRecalls(make, model, year);
    sources.push({
      name: "NHTSA Recalls",
      url: "https://api.nhtsa.gov/recalls/recallsByVehicle",
      retrievedAt: new Date().toISOString(),
      fieldsProvided: recalls.success ? ["recalls"] : [],
      success: recalls.success,
      error: recalls.error,
    });

    if (recalls.success) {
      report.safety.recalls = recalls.items;
      report.safety.recallsAvailable = true;
      report.safety.recallsNote =
        recalls.count === 0
          ? "No safety recalls found for this Year / Make / Model in the NHTSA database. Always verify with the exact VIN at nhtsa.gov/recalls."
          : undefined;
    } else {
      report.safety.recallsNote =
        recalls.error ||
        "Recall information was not available from the connected free source.";
    }
  }

  report.dataCompleteness = calcCompleteness(report);
  report.sources = sources;
  report.updatedAt = new Date().toISOString();

  return { report, errors };
}

export function createEmptyReport(vin: string): VehicleReport {
  const now = new Date().toISOString();
  return {
    id: generateReportId(),
    vin,
    createdAt: now,
    updatedAt: now,
    identification: {},
    engine: {},
    drivetrain: {},
    dimensions: {},
    manufacturing: {},
    safety: {
      recalls: [],
      recallsAvailable: false,
      recallsNote: "Not available from free sources",
    },
    sources: [],
    dataCompleteness: 0,
    manual: emptyManual(),
    wmi: lookupWmi(vin),
  };
}
