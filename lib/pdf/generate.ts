import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { VehicleReport, BrandingSettings } from "../types";

function val(v: string | undefined, fallback = "Not available from free sources"): string {
  if (!v || !String(v).trim()) return fallback;
  return String(v).trim();
}

function addHeader(doc: jsPDF, branding: BrandingSettings, report: VehicleReport, pageTitle: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(branding.company || branding.name || "VIN Vehicle Report", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(pageTitle, 14, 20);
  doc.setFontSize(8);
  doc.text(`Report: ${report.id}`, pageW - 14, 12, { align: "right" });
  doc.text(`VIN: ${report.vin}`, pageW - 14, 20, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF, branding: BrandingSettings, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(branding.reportFooter || "", 14, pageH - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 14, pageH - 10, { align: "right" });
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageH - 14, pageW - 14, pageH - 14);
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text(title, 14, y);
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 196, y + 2);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 10;
}

export function generatePdf(report: VehicleReport, branding: BrandingSettings): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // PAGE 1: Cover
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 55, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(branding.defaultReportTitle || "VEHICLE VIN REPORT", 14, 22);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(branding.company || branding.name || "", 14, 32);
  if (branding.email || branding.phone) {
    doc.setFontSize(9);
    doc.text([branding.email, branding.phone].filter(Boolean).join("  \u00b7  "), 14, 40);
  }
  doc.setFontSize(10);
  doc.text(`Report No: ${report.id}`, pageW - 14, 22, { align: "right" });
  doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, pageW - 14, 30, { align: "right" });

  y = 70;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const vehicleTitle = [report.identification.modelYear, report.identification.make, report.identification.model].filter(Boolean).join(" ") || "Vehicle Report";
  doc.text(vehicleTitle, 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(`VIN: ${report.vin}`, 14, y);
  y += 6;
  if (report.identification.trim) {
    doc.text(`Trim / Series: ${report.identification.trim}`, 14, y);
    y += 6;
  }
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Attribute", "Value"]],
    body: [
      ["Make", val(report.identification.make)],
      ["Model", val(report.identification.model)],
      ["Model Year", val(report.identification.modelYear)],
      ["Body Class", val(report.identification.bodyClass)],
      ["Vehicle Type", val(report.identification.vehicleType)],
      ["Drive Type", val(report.drivetrain.driveType)],
      ["Fuel Type", val(report.engine.fuelType)],
      ["Engine", val([report.engine.cylinders ? `${report.engine.cylinders} cyl` : null, report.engine.displacement, report.engine.horsepower ? `${report.engine.horsepower} hp` : null].filter(Boolean).join(" \u00b7 ") || undefined)],
      ["Data Completeness", `${report.dataCompleteness}%`],
      ["Overall Condition", report.manual.condition.overall.replace(/_/g, " ")],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Data completeness indicates how many requested fields were populated. It does not guarantee factual accuracy.", 14, y, { maxWidth: pageW - 28 });

  // PAGE 2: Identification
  doc.addPage();
  addHeader(doc, branding, report, "Vehicle Identification");
  y = 38;
  y = sectionTitle(doc, "Identification Details", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["VIN", report.vin],
      ["Make", val(report.identification.make)],
      ["Manufacturer", val(report.identification.manufacturer)],
      ["Model", val(report.identification.model)],
      ["Model Year", val(report.identification.modelYear)],
      ["Trim", val(report.identification.trim)],
      ["Series", val(report.identification.series)],
      ["Vehicle Type", val(report.identification.vehicleType)],
      ["Body Class", val(report.identification.bodyClass)],
      ["Vehicle Class", val(report.identification.vehicleClass)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  if (report.wmi) {
    y = sectionTitle(doc, "WMI-Derived Information", y);
    autoTable(doc, {
      startY: y,
      body: [
        ["WMI Code", report.wmi.code],
        ["Manufacturer (WMI)", val(report.wmi.manufacturer)],
        ["Country (WMI)", val(report.wmi.country)],
        ["Region (WMI)", val(report.wmi.region)],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("WMI information is derived from the first characters of the VIN and may not reflect the full vehicle configuration.", 14, y, { maxWidth: pageW - 28 });
  }

  // PAGE 3: Engine
  doc.addPage();
  addHeader(doc, branding, report, "Engine & Drivetrain");
  y = 38;
  y = sectionTitle(doc, "Engine", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Engine Model", val(report.engine.engineModel)],
      ["Displacement", val(report.engine.displacement)],
      ["Cylinders", val(report.engine.cylinders)],
      ["Configuration", val(report.engine.configuration)],
      ["Fuel Type", val(report.engine.fuelType)],
      ["Horsepower", val(report.engine.horsepower)],
      ["Engine Manufacturer", val(report.engine.manufacturer)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  y = sectionTitle(doc, "Transmission & Drivetrain", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Transmission", val(report.drivetrain.transmission)],
      ["Transmission Speeds", val(report.drivetrain.transmissionSpeeds)],
      ["Drive Type", val(report.drivetrain.driveType)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  y = sectionTitle(doc, "Body & Dimensions", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Doors", val(report.dimensions.doors)],
      ["Seats", val(report.dimensions.seats)],
      ["GVWR", val(report.dimensions.gvwr)],
      ["Bed Type", val(report.dimensions.bedType)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  // PAGE 4: Manufacturing
  doc.addPage();
  addHeader(doc, branding, report, "Manufacturing Information");
  y = 38;
  y = sectionTitle(doc, "Plant & Origin", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Plant Country", val(report.manufacturing.plantCountry)],
      ["Plant State", val(report.manufacturing.plantState)],
      ["Plant City", val(report.manufacturing.plantCity)],
      ["Plant Company", val(report.manufacturing.plantCompany)],
      ["Region", val(report.manufacturing.region)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  // PAGE 5: Recalls
  doc.addPage();
  addHeader(doc, branding, report, "Safety / Recall Information");
  y = 38;
  y = sectionTitle(doc, "NHTSA Safety Recalls", y);

  if (!report.safety.recallsAvailable || report.safety.recalls.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(report.safety.recallsNote || "Recall information was not available from the connected free source.", 14, y, { maxWidth: pageW - 28 });
    y += 16;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Always verify open recalls at https://www.nhtsa.gov/recalls using the exact VIN for the most precise match.", 14, y, { maxWidth: pageW - 28 });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`${report.safety.recalls.length} recall campaign(s) found for this Year / Make / Model.`, 14, y);
    y += 8;
    for (const r of report.safety.recalls.slice(0, 8)) {
      if (y > 250) {
        doc.addPage();
        addHeader(doc, branding, report, "Safety / Recall Information (cont.)");
        y = 38;
      }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 95);
      doc.text(`${r.campaignNumber}  \u2014  ${r.component || "Component N/A"}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      if (r.summary) {
        const lines = doc.splitTextToSize(r.summary, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 2;
      }
      if (r.remedy) {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const rem = doc.splitTextToSize(`Remedy: ${r.remedy}`, pageW - 28);
        doc.text(rem, 14, y);
        y += rem.length * 3.5 + 4;
      }
      y += 4;
    }
  }

  // PAGE 6: Manual
  doc.addPage();
  addHeader(doc, branding, report, "Manual Inspection & Client Information");
  y = 38;
  y = sectionTitle(doc, "Client & Inspection Details (User-provided)", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Client Name", val(report.manual.clientName, "\u2014")],
      ["Client Reference", val(report.manual.clientReference, "\u2014")],
      ["Registration", val(report.manual.registration, "\u2014")],
      ["Mileage", val(report.manual.mileage, "\u2014")],
      ["Purchase Price", val(report.manual.purchasePrice, "\u2014")],
      ["Inspection Date", val(report.manual.inspectionDate, "\u2014")],
      ["Inspector", val(report.manual.inspectorName, "\u2014")],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  y = sectionTitle(doc, "Vehicle Condition Assessment (User-provided)", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Overall", report.manual.condition.overall.replace(/_/g, " ")],
      ["Exterior", report.manual.condition.exterior.replace(/_/g, " ")],
      ["Interior", report.manual.condition.interior.replace(/_/g, " ")],
      ["Engine", report.manual.condition.engine.replace(/_/g, " ")],
      ["Transmission", report.manual.condition.transmission.replace(/_/g, " ")],
      ["Electrical", report.manual.condition.electrical.replace(/_/g, " ")],
      ["Tires", report.manual.condition.tires.replace(/_/g, " ")],
      ["Brakes", report.manual.condition.brakes.replace(/_/g, " ")],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] } },
    margin: { left: 14, right: 14 },
  });

  if (report.manual.notes || report.manual.additionalFindings) {
    y = (doc as any).lastAutoTable.finalY + 12;
    y = sectionTitle(doc, "Notes & Findings (User-provided)", y);
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    if (report.manual.notes) {
      const lines = doc.splitTextToSize(report.manual.notes, pageW - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4 + 4;
    }
    if (report.manual.additionalFindings) {
      const lines = doc.splitTextToSize(report.manual.additionalFindings, pageW - 28);
      doc.text(lines, 14, y);
    }
  }

  // Photos
  if (report.manual.photos.length > 0) {
    doc.addPage();
    addHeader(doc, branding, report, "Vehicle Photos");
    y = 38;
    y = sectionTitle(doc, "Attached Photos (User-provided)", y);
    const maxW = 80;
    const maxH = 55;
    let x = 14;
    let col = 0;
    for (const photo of report.manual.photos.slice(0, 8)) {
      try {
        if (y + maxH > 270) {
          doc.addPage();
          addHeader(doc, branding, report, "Vehicle Photos (cont.)");
          y = 38;
          x = 14;
          col = 0;
        }
        doc.addImage(photo.dataUrl, "JPEG", x, y, maxW, maxH);
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(photo.label, x, y + maxH + 4);
        col++;
        if (col >= 2) {
          col = 0;
          x = 14;
          y += maxH + 12;
        } else {
          x = 14 + maxW + 10;
        }
      } catch {
        // skip
      }
    }
  }

  // Final: Sources & Disclaimer
  doc.addPage();
  addHeader(doc, branding, report, "Sources, Limitations & Disclaimer");
  y = 38;
  y = sectionTitle(doc, "Data Sources", y);
  for (const s of report.sources) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(`${s.name}${s.success ? "" : " (unavailable)"}`, 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    if (s.url) doc.text(s.url, 14, y);
    y += 4;
    doc.text(`Retrieved: ${new Date(s.retrievedAt).toLocaleString()}`, 14, y);
    y += 4;
    if (s.error) {
      doc.setTextColor(150, 50, 50);
      doc.text(s.error, 14, y);
      y += 4;
    }
    y += 4;
  }

  y += 6;
  y = sectionTitle(doc, "Important Limitations", y);
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  const limitations = [
    "This report uses free public data primarily from the U.S. National Highway Traffic Safety Administration (NHTSA).",
    "It does NOT include ownership history, accident records, title brands, odometer readings, service history, auction history, or insurance claims.",
    "Missing information does not mean the vehicle has a clean history.",
    "Never assume \"no accidents\", \"clean title\", or \"one owner\" unless verified by an authoritative paid source.",
    "Always verify open recalls at nhtsa.gov/recalls using the exact VIN.",
    "User-provided information is not independently verified by this tool.",
  ];
  for (const line of limitations) {
    const lines = doc.splitTextToSize("\u2022 " + line, pageW - 28);
    doc.text(lines, 14, y);
    y += lines.length * 3.8 + 2;
  }

  y += 8;
  y = sectionTitle(doc, "Disclaimer", y);
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  const disc = doc.splitTextToSize(
    branding.disclaimer ||
      "Information in this report is compiled from available external data sources and user-provided information. Availability and accuracy depend on the underlying sources. The absence of information does not confirm that an event did not occur. This report is not a substitute for a professional mechanical inspection, official title verification, or a comprehensive paid vehicle-history report.",
    pageW - 28
  );
  doc.text(disc, 14, y);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) addFooter(doc, branding, i, totalPages);
  }

  return doc;
}

export function downloadPdf(report: VehicleReport, branding: BrandingSettings): void {
  const doc = generatePdf(report, branding);
  const label = [report.identification.modelYear, report.identification.make, report.identification.model].filter(Boolean).join("_") || "Vehicle";
  const filename = `Vehicle_Report_${report.vin}_${label}.pdf`.replace(/\s+/g, "_");
  doc.save(filename);
}
