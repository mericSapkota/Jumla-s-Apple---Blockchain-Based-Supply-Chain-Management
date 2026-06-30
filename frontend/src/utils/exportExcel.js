import * as XLSX from "xlsx";

function formatDateCell(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
}

/**
 * Flattens a batch object (including nested transit checkpoints) into
 * one or more spreadsheet-friendly rows.
 */
function batchToRows(batch) {
  const base = {
    "Batch ID": batch.batchId,
    Status: batch.status,
    "Farmer Name": batch.farmerName,
    "Farmer Email": batch.farmerEmail,
    "Farm Location": batch.farmLocation,
    Variety: batch.appleVariety,
    "Weight (kg)": batch.weightKg,
    "Harvest Date": formatDateCell(batch.harvestDate),
    "Certified At": formatDateCell(batch.certifiedAt),
    "Transit Started": formatDateCell(batch.transitStartedAt),
    Destination: batch.destination,
    "Delivered At": formatDateCell(batch.deliveredAt),
    "AI Result": batch.aiResult,
    "IPFS Hash": batch.ipfsHash,
    "Tx — Create": batch.txHashCreate,
    "Tx — Certify": batch.txHashCertify,
    "Tx — Transit": batch.txHashTransit,
    "Tx — Deliver": batch.txHashDeliver,
    "Created At": formatDateCell(batch.createdAt),
    "Updated At": formatDateCell(batch.updatedAt),
  };

  if (!batch.transitHistory || batch.transitHistory.length === 0) {
    return [{ ...base, "Checkpoint Location": "", "Checkpoint Time": "", "Checkpoint Updated By": "" }];
  }

  return batch.transitHistory.map((cp) => ({
    ...base,
    "Checkpoint Location": cp.location,
    "Checkpoint Time": cp.timestamp ? new Date(cp.timestamp * 1000).toLocaleString() : "",
    "Checkpoint Updated By": cp.updatedBy,
  }));
}

/**
 * Exports a list of batches (with optional nested transitHistory) to a
 * downloadable .xlsx file. One row per batch, or one row per checkpoint
 * if a batch has multiple transit checkpoints.
 */
export function exportBatchesToExcel(batches, filename = "jumla-batches") {
  if (!batches || batches.length === 0) return;

  const rows = batches.flatMap(batchToRows);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Reasonable column widths so it's readable on open
  worksheet["!cols"] = Object.keys(rows[0]).map((key) => ({
    wch: Math.min(Math.max(key.length, 14), 40),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batches");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}-${stamp}.xlsx`);
}
