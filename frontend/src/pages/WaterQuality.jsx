import React, { useState, useEffect } from 'react';
import {
  TestTube,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FlaskConical,
  Droplets,
  Thermometer,
  FileText,
  Calendar,
  ChevronDown,
  Trash2,
  ClipboardList,
  ShieldCheck,
  Activity,
  Download,
  Edit2,
} from 'lucide-react';


// ─── Water Quality Parameters (Excel: Aquro_Water_Parameters_Complete.xlsx) ──
const PARAMETERS = [
  // Physical / Chemical
  { key: 'ph',          label: 'pH Value',           unit: '',      min: 6.5,   max: 8.5,   icon: '⚗️',  bisLimit: '6.5 – 8.5',       bestRange: '7.0 – 7.5' },
  { key: 'tds',         label: 'TDS',                unit: 'mg/L',  min: 0,     max: 500,   icon: '💧',  bisLimit: 'Max 500',          bestRange: '80 – 150' },
  { key: 'turbidity',   label: 'Turbidity',          unit: 'NTU',   min: 0,     max: 1,     icon: '🌫️', bisLimit: 'Max 1',            bestRange: '< 0.5' },
  { key: 'hardness',    label: 'Total Hardness',     unit: 'mg/L',  min: 0,     max: 200,   icon: '🪨',  bisLimit: 'Max 200',          bestRange: '50 – 100' },
  { key: 'calcium',     label: 'Calcium',            unit: 'mg/L',  min: 0,     max: 75,    icon: '🦴',  bisLimit: 'Max 75',           bestRange: '20 – 40' },
  { key: 'magnesium',   label: 'Magnesium',          unit: 'mg/L',  min: 0,     max: 30,    icon: '⚙️', bisLimit: 'Max 30',           bestRange: '5 – 15' },
  { key: 'alkalinity',  label: 'Alkalinity',         unit: 'mg/L',  min: 0,     max: 200,   icon: '🧬',  bisLimit: 'Max 200',          bestRange: '40 – 80' },
  { key: 'chloride',    label: 'Chloride',           unit: 'mg/L',  min: 0,     max: 250,   icon: '🧪',  bisLimit: 'Max 250',          bestRange: '< 50' },
  { key: 'sulphate',    label: 'Sulphate',           unit: 'mg/L',  min: 0,     max: 200,   icon: '🌡️', bisLimit: 'Max 200',          bestRange: '< 50' },
  { key: 'nitrate',     label: 'Nitrate',            unit: 'mg/L',  min: 0,     max: 45,    icon: '🌿',  bisLimit: 'Max 45',           bestRange: '< 10' },
  { key: 'fluoride',    label: 'Fluoride',           unit: 'mg/L',  min: 0,     max: 1.0,   icon: '⚡',  bisLimit: 'Max 1.0',          bestRange: '0.5 – 0.8' },
  { key: 'sodium',      label: 'Sodium',             unit: 'mg/L',  min: 0,     max: 200,   icon: '🧂',  bisLimit: 'As per source',    bestRange: 'Low' },
  { key: 'potassium',   label: 'Potassium',          unit: 'mg/L',  min: 0,     max: 100,   icon: '🍌',  bisLimit: 'As per source',    bestRange: 'Low' },
  { key: 'iron',        label: 'Iron',               unit: 'mg/L',  min: 0,     max: 0.1,   icon: '🔩',  bisLimit: 'Max 0.1',          bestRange: '< 0.03' },
  { key: 'manganese',   label: 'Manganese',          unit: 'mg/L',  min: 0,     max: 0.05,  icon: '🔘',  bisLimit: 'Max 0.05',         bestRange: '< 0.01' },
  { key: 'copper',      label: 'Copper',             unit: 'mg/L',  min: 0,     max: 0.05,  icon: '🟤',  bisLimit: 'Max 0.05',         bestRange: '< 0.01' },
  { key: 'zinc',        label: 'Zinc',               unit: 'mg/L',  min: 0,     max: 5,     icon: '🔵',  bisLimit: 'Max 5',            bestRange: '< 1' },
  { key: 'lead',        label: 'Lead',               unit: 'mg/L',  min: 0,     max: 0.01,  icon: '⬛',  bisLimit: 'Max 0.01',         bestRange: 'ND' },
  { key: 'arsenic',     label: 'Arsenic',            unit: 'mg/L',  min: 0,     max: 0.01,  icon: '☠️', bisLimit: 'Max 0.01',         bestRange: 'ND' },
  { key: 'cadmium',     label: 'Cadmium',            unit: 'mg/L',  min: 0,     max: 0.003, icon: '🟡',  bisLimit: 'Max 0.003',        bestRange: 'ND' },
  { key: 'chromium',    label: 'Chromium',           unit: 'mg/L',  min: 0,     max: 0.05,  icon: '🟠',  bisLimit: 'Max 0.05',         bestRange: 'ND' },
  { key: 'mercury',     label: 'Mercury',            unit: 'mg/L',  min: 0,     max: 0.001, icon: '💊',  bisLimit: 'Max 0.001',        bestRange: 'ND' },
  { key: 'residualOzone', label: 'Residual Ozone',  unit: 'mg/L',  min: 0.1,   max: 0.4,   icon: '🌀',  bisLimit: '0.1 – 0.4',        bestRange: '0.2 – 0.3' },
  // Microbiological
  { key: 'coliform',    label: 'Total Coliform',     unit: '/250mL', min: 0,    max: 0,     icon: '🦠',  bisLimit: 'Absent/250 mL',    bestRange: 'Absent', isMicro: true },
  { key: 'ecoli',       label: 'E. coli',            unit: '/250mL', min: 0,    max: 0,     icon: '🔬',  bisLimit: 'Absent/250 mL',    bestRange: 'Absent', isMicro: true },
  { key: 'pseudomonas', label: 'Pseudomonas',        unit: '/250mL', min: 0,    max: 0,     icon: '🧫',  bisLimit: 'Absent/250 mL',    bestRange: 'Absent', isMicro: true },
  { key: 'salmonella',  label: 'Salmonella',         unit: '/250mL', min: 0,    max: 0,     icon: '🦟',  bisLimit: 'Absent',           bestRange: 'Absent', isMicro: true },
  { key: 'tpc',         label: 'TPC',                unit: 'CFU/mL', min: 0,    max: 10,    icon: '🧪',  bisLimit: 'Very Low',         bestRange: '< 10 CFU/mL' },
];

function getParamStatus(key, value) {
  const p = PARAMETERS.find((x) => x.key === key);
  if (!p || value === '' || value === null || value === undefined) return 'unknown';
  
  const strVal = String(value).trim().toLowerCase();
  if (strVal === 'nt' || strVal === 'n/a') return 'unknown';

  // Microbiological: Absent = pass, anything else = fail
  if (p.isMicro) {
    if (strVal === 'absent' || strVal === 'nd' || strVal === '0') return 'pass';
    return 'fail';
  }
  const v = parseFloat(value);
  if (isNaN(v)) return (p.bestRange === 'ND' || strVal === 'nd') ? 'pass' : 'unknown';
  if (v >= p.min && v <= p.max) return 'pass';
  // Warning zone: within 10% beyond limit
  if (p.max > 0 && v > p.max && v <= p.max * 1.1) return 'warning';
  return 'fail';
}

function getOverallStatus(record) {
  const statuses = PARAMETERS.map((p) => getParamStatus(p.key, record[p.key]));
  if (statuses.some((s) => s === 'fail')) return 'fail';
  if (statuses.some((s) => s === 'warning')) return 'warning';
  
  const testedStatuses = statuses.filter(s => s !== 'unknown');
  if (testedStatuses.length > 0 && testedStatuses.every((s) => s === 'pass')) return 'pass';
  if (testedStatuses.length === 0) return 'pending';
  
  return 'pending';
}

const STATUS_CONFIG = {
  pass: { label: 'Passed', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: CheckCircle },
  fail: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle },
  warning: { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: AlertTriangle },
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: ClipboardList },
  unknown: { label: '—', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', icon: ClipboardList },
};

const emptyForm = () => {
  let defaults = {};
  try {
    defaults = JSON.parse(localStorage.getItem('aquro_wq_defaults')) || {};
  } catch(e) {}
  return {
    date: new Date().toISOString().split('T')[0],
    sampleId: '',
    batchNumber: '',
    source: 'RO Plant Output',
    testedBy: '',
    ...Object.fromEntries(PARAMETERS.map((p) => [p.key, defaults[p.key] || ''])),
    remarks: '',
  };
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WaterQuality() {
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchRecords = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/water-quality');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.map(d => ({ ...d, id: d._id })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSaveDefaults = () => {
    const defaults = {};
    PARAMETERS.forEach(p => {
      if (form[p.key]) defaults[p.key] = form[p.key];
    });
    localStorage.setItem('aquro_wq_defaults', JSON.stringify(defaults));
    alert('Badiya! Ye values ab naye reports me automatically fill ho jayengi.');
  };

  const handleAdd = async () => {
    if (!form.sampleId.trim() || !form.date || !form.testedBy.trim()) {
      alert('Sample ID, Date aur Tested By fields zaruri hain.');
      return;
    }
    try {
      const url = form.id 
        ? `${import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com'}/api/water-quality/${form.id}`
        : `${import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com'}/api/water-quality`;
        
      const res = await fetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        fetchRecords();
        setShowModal(false);
        setForm(emptyForm());
      }
    } catch (error) {
      console.error(error);
      alert('Backend connection error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Kya aap is record ko delete karna chahte hain?')) {
      try {
        const res = await fetch(
          (import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/water-quality/${id}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          fetchRecords();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDownloadPDF = (record) => {
    const overall = getOverallStatus(record);
    const overallCfg = STATUS_CONFIG[overall] || STATUS_CONFIG['pending'];
    const statusColors = { pass: '#059669', fail: '#dc2626', warning: '#d97706', pending: '#64748b', unknown: '#94a3b8' };

    const reportNo = `AQURO/WQ/${record.batchNumber || record.sampleId}/${new Date().getFullYear()}`;
    const revNo = 'R00';
    const genDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const samplingDate = record.date;

    const HEAVY_METALS = ['lead','arsenic','cadmium','chromium','mercury'];

    // Lookup bisLimit override for Sodium/Potassium
    const bisLimitOverride = { sodium: 'No BIS Limit Specified', potassium: 'No BIS Limit Specified' };

    const TEST_METHODS = {
      ph: 'IS 3025 (Part 11)',
      tds: 'IS 3025 (Part 16)',
      turbidity: 'IS 3025 (Part 10)',
      hardness: 'IS 3025 (Part 21)',
      calcium: 'IS 3025 (Part 40)',
      magnesium: 'IS 3025 (Part 46)',
      alkalinity: 'IS 3025 (Part 23)',
      chloride: 'IS 3025 (Part 32)',
      sulphate: 'IS 3025 (Part 24)',
      nitrate: 'IS 3025 (Part 34)',
      fluoride: 'IS 3025 (Part 60)',
      sodium: 'IS 3025 (Part 45)',
      potassium: 'IS 3025 (Part 45)',
      iron: 'IS 3025 (Part 53)',
      manganese: 'IS 3025 (Part 59)',
      copper: 'IS 3025 (Part 42)',
      zinc: 'IS 3025 (Part 49)',
      lead: 'IS 3025 (Part 55)',
      arsenic: 'IS 3025 (Part 37)',
      cadmium: 'IS 3025 (Part 41)',
      chromium: 'IS 3025 (Part 52)',
      mercury: 'IS 3025 (Part 48)',
      residualOzone: 'IS 3025',
      coliform: 'IS 1622',
      ecoli: 'IS 1622',
      pseudomonas: 'IS 13428',
      salmonella: 'IS 5887',
      tpc: 'IS 5401',
    };

    const buildRows = (params) => params.map(p => {
      const rawVal = record[p.key];
      const strVal = rawVal !== undefined && rawVal !== null && rawVal !== '' ? String(rawVal).trim() : '';
      
      // NT handling: heavy metals default to NT if value is 'ND' and no explicit test data
      const isHeavyMetal = HEAVY_METALS.includes(p.key);
      let displayVal, status, statusLabel, statusColor;

      if (strVal === '' || strVal.toLowerCase() === 'nt' || strVal.toLowerCase() === 'n/a' || (isHeavyMetal && strVal.toLowerCase() === 'nd')) {
        displayVal = 'NT (Not Tested)';
        status = 'unknown';
        statusLabel = 'NT';
        statusColor = '#94a3b8';
      } else {
        displayVal = `${strVal}${p.unit ? ' ' + p.unit : ''}`;
        status = getParamStatus(p.key, rawVal);
        statusLabel = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'warning' ? 'WARN' : '—';
        statusColor = statusColors[status] || '#94a3b8';
      }

      const bisLimitDisplay = bisLimitOverride[p.key] || p.bisLimit || '—';
      const method = TEST_METHODS[p.key] || 'IS 3025';

      return `<tr>
        <td>${p.label}</td>
        <td style="text-align:center;font-weight:600;">${displayVal}</td>
        <td style="text-align:center;">${bisLimitDisplay}</td>
        <td style="text-align:center;">${p.bestRange || '—'}</td>
        <td style="text-align:center;font-size:9px;color:#475569;">${method}</td>
        <td style="text-align:center;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-weight:700;font-size:10px;color:#fff;background:${statusColor};">${statusLabel}</span>
        </td>
      </tr>`;
    }).join('');

    const chemParams = PARAMETERS.filter(p => !p.isMicro);
    const microParams = PARAMETERS.filter(p => p.isMicro);
    const chemRowsHtml = buildRows(chemParams);
    const microRowsHtml = buildRows(microParams);

    const testedCount = PARAMETERS.filter(p => {
      const v = String(record[p.key] || '').trim().toLowerCase();
      return v !== '' && v !== 'nt' && v !== 'n/a' && !(HEAVY_METALS.includes(p.key) && v === 'nd');
    }).length;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Water Quality Report — ${record.sampleId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#1e293b; background:#fff; font-size:11px; }
    
    /* Header */
    .page-header { background:linear-gradient(135deg,#0369a1,#0ea5e9); color:#fff; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; }
    .company-info h1 { font-size:20px; font-weight:800; letter-spacing:1px; }
    .company-info p { font-size:9.5px; opacity:.85; margin-top:2px; }
    .report-meta { text-align:right; font-size:9px; opacity:.9; line-height:1.7; }
    .report-meta strong { font-size:11px; display:block; }

    /* Title bar */
    .title-bar { background:#f0f9ff; border-bottom:2px solid #0ea5e9; padding:7px 20px; display:flex; align-items:center; justify-content:space-between; }
    .title-bar h2 { font-size:13px; font-weight:700; color:#0369a1; }
    .ref-standards { font-size:9px; color:#64748b; text-align:right; line-height:1.6; }

    /* Body */
    .body-wrap { padding:12px 20px; }
    .divider { height:1.5px; background:linear-gradient(to right,#0ea5e9,#e2e8f0); margin:10px 0; }

    /* Info grid */
    .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px 16px; margin-bottom:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; }
    .info-item label { font-size:8.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
    .info-item p { font-size:11px; font-weight:600; color:#0f172a; margin-top:1px; }
    .badge { display:inline-block; padding:2px 10px; border-radius:4px; font-size:10px; font-weight:700; color:#fff; }

    /* Tables */
    .section-title { font-size:10px; font-weight:700; color:#0369a1; text-transform:uppercase; letter-spacing:.6px; margin:10px 0 4px; padding-bottom:3px; border-bottom:1.5px solid #bae6fd; }
    table { width:100%; border-collapse:collapse; font-size:10px; }
    thead tr { background:#0369a1; color:#fff; }
    thead th { padding:5px 8px; text-align:left; font-weight:700; font-size:9.5px; }
    tbody tr:nth-child(even) { background:#f0f9ff; }
    tbody td { padding:4px 8px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
    tbody tr:hover { background:#e0f2fe; }

    /* Remarks */
    .remarks-box { background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #0ea5e9; border-radius:6px; padding:9px 13px; margin-top:10px; }
    .remarks-box .rhead { font-size:9.5px; font-weight:700; color:#0369a1; text-transform:uppercase; margin-bottom:5px; }
    .remarks-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; }
    .remarks-item label { font-size:8.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; }
    .remarks-item p { font-size:10px; color:#1e293b; }

    /* Legend */
    .legend { margin-top:10px; background:#fffbeb; border:1px solid #fde68a; border-radius:5px; padding:7px 12px; font-size:9px; color:#78350f; }
    .legend strong { color:#92400e; }

    /* Disclaimer */
    .disclaimer { margin-top:8px; background:#fef2f2; border:1px solid #fecaca; border-radius:5px; padding:7px 12px; font-size:9px; color:#7f1d1d; font-style:italic; }

    /* Signature section */
    .sig-section { margin-top:12px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
    .sig-box { border-top:1.5px solid #64748b; padding-top:6px; }
    .sig-box .sig-line { height:30px; border:1px dashed #cbd5e1; border-radius:4px; margin-bottom:5px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:9px; }
    .sig-box label { font-size:8.5px; font-weight:700; color:#64748b; text-transform:uppercase; display:block; }
    .sig-box p { font-size:10px; color:#1e293b; font-weight:600; }

    /* Stamp area */
    .stamp-area { border:2px dashed #0ea5e9; border-radius:8px; width:90px; height:70px; display:flex; align-items:center; justify-content:center; color:#0ea5e9; font-size:8px; font-weight:700; text-align:center; }

    /* Footer */
    .page-footer { margin-top:14px; background:#f1f5f9; border-top:1.5px solid #e2e8f0; padding:8px 20px; display:flex; justify-content:space-between; align-items:center; }
    .page-footer .left { font-size:8.5px; color:#64748b; }
    .page-footer .right { font-size:8.5px; color:#94a3b8; }

    @page { size: A4; margin: 8mm; }
    @media print {
      body { font-size:10px; }
      .page-header { padding:10px 16px; }
      .company-info h1 { font-size:17px; }
      .body-wrap { padding:8px 16px; }
      .info-grid { padding:7px 10px; }
      table { font-size:9px; }
      thead th { padding:4px 6px; }
      tbody td { padding:3px 6px; }
      .sig-section { margin-top:10px; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="page-header">
    <div class="company-info">
      <h1>💧 AQURO</h1>
      <p>Premium Packaged Drinking Water</p>
      <p style="margin-top:3px;">AQURO Water Pvt. Ltd. | aqurowater.com | contact@aqurowater.com</p>
    </div>
    <div class="report-meta">
      <strong>WATER QUALITY TEST REPORT</strong>
      Report No.: ${reportNo}<br/>
      Revision: ${revNo}<br/>
      Page: 1 of 1<br/>
      Generated: ${genDate}
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <h2>📋 Water Quality Analysis Report — ${record.sampleId}</h2>
    <div class="ref-standards">
      <strong>Reference Standards:</strong>
      IS 14543 (Packaged Drinking Water) &nbsp;|&nbsp; IS 10500 (Drinking Water Specification)
    </div>
  </div>

  <div class="body-wrap">

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-item"><label>Sample ID</label><p>${record.sampleId}</p></div>
      <div class="info-item"><label>Sampling Date</label><p>${samplingDate}</p></div>
      <div class="info-item"><label>Report Date</label><p>${genDate}</p></div>
      ${record.batchNumber ? `<div class="info-item"><label>Batch Number</label><p>${record.batchNumber}</p></div>` : ''}
      <div class="info-item"><label>Sample Source</label><p>${record.source || '—'}</p></div>
      <div class="info-item"><label>Tested By</label><p>${record.testedBy || '—'}</p></div>
      <div class="info-item"><label>Parameters Tested</label><p>${testedCount} / ${PARAMETERS.length}</p></div>
      <div class="info-item"><label>Overall Result</label>
        <p><span class="badge" style="background:${statusColors[overall]};">${overallCfg.label}</span></p>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Physical & Chemical Parameters -->
    <div class="section-title">Physical &amp; Chemical Parameters</div>
    <table>
      <thead><tr>
        <th style="width:22%">Parameter</th>
        <th style="width:15%;text-align:center;">Result</th>
        <th style="width:18%;text-align:center;">BIS Limit (IS 10500 / IS 14543)</th>
        <th style="width:15%;text-align:center;">Best Range</th>
        <th style="width:18%;text-align:center;">Test Method</th>
        <th style="width:12%;text-align:center;">Status</th>
      </tr></thead>
      <tbody>${chemRowsHtml}</tbody>
    </table>

    <!-- Microbiological Parameters -->
    <div class="section-title" style="margin-top:12px;">Microbiological Parameters</div>
    <table>
      <thead><tr>
        <th style="width:22%">Parameter</th>
        <th style="width:15%;text-align:center;">Result</th>
        <th style="width:18%;text-align:center;">BIS Limit (IS 10500 / IS 14543)</th>
        <th style="width:15%;text-align:center;">Best Range</th>
        <th style="width:18%;text-align:center;">Test Method</th>
        <th style="width:12%;text-align:center;">Status</th>
      </tr></thead>
      <tbody>${microRowsHtml}</tbody>
    </table>

    <!-- Legend -->
    <div class="legend">
      <strong>Legend:</strong> &nbsp;
      <strong style="color:#059669;">PASS</strong> = Within permissible limit &nbsp;|&nbsp;
      <strong style="color:#dc2626;">FAIL</strong> = Exceeds permissible limit &nbsp;|&nbsp;
      <strong style="color:#d97706;">WARN</strong> = Near limit (within 10%) &nbsp;|&nbsp;
      <strong>NT</strong> = Not Tested (parameter not included in current test scope) &nbsp;|&nbsp;
      <strong>ND</strong> = Not Detected (based on laboratory testing) &nbsp;|&nbsp;
      <strong>—</strong> = No data
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      ⚠️ <strong>Disclaimer:</strong> This report is intended for internal quality monitoring purposes only. Results are based on actual tests conducted in-house. Parameters marked <strong>NT (Not Tested)</strong> were not included in the current test scope and should not be inferred as passing or failing. This report does not constitute a NABL/third-party accredited laboratory certificate.
    </div>

    <!-- Remarks -->
    <div class="remarks-box" style="margin-top:10px;">
      <div class="rhead">📝 Remarks &amp; Testing Summary</div>
      <div class="remarks-grid">
        <div class="remarks-item"><label>Batch Number</label><p>${record.batchNumber || '—'}</p></div>
        <div class="remarks-item"><label>Sampling Date</label><p>${samplingDate}</p></div>
        <div class="remarks-item"><label>Report Generation Date</label><p>${genDate}</p></div>
        <div class="remarks-item"><label>Testing Status</label><p>${overall === 'pass' ? '✅ All tested parameters passed' : overall === 'fail' ? '❌ One or more parameters failed' : overall === 'warning' ? '⚠️ Warning — near limit' : '🔵 Partial / Pending'}</p></div>
        <div class="remarks-item" style="grid-column:span 2;"><label>Additional Notes</label><p>${record.remarks || 'No additional remarks.'}</p></div>
      </div>
    </div>

    <!-- Signature & Approval -->
    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-line">Sign here</div>
        <label>Tested By</label>
        <p>${record.testedBy || '___________________'}</p>
      </div>
      <div class="sig-box">
        <div class="sig-line">Sign here</div>
        <label>Reviewed By</label>
        <p>___________________</p>
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;">
        <div class="sig-box" style="flex:1;">
          <div class="sig-line">Sign here</div>
          <label>Authorized Signatory</label>
          <p>___________________</p>
        </div>
        <div class="stamp-area">OFFICIAL<br/>STAMP</div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="page-footer">
    <div class="left">
      AQURO Water Pvt. Ltd. &nbsp;|&nbsp; Report No.: ${reportNo} &nbsp;|&nbsp; Rev.: ${revNo} &nbsp;|&nbsp; Page 1 of 1
    </div>
    <div class="right">
      This is a system-generated internal quality report. &nbsp;|&nbsp; Confidential — Not for public distribution.
    </div>
  </div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=1050,height=800');
    if (!win) { alert('Popup blocked! Please allow popups for this site.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 700);
  };



  const filtered = filterStatus === 'all'
    ? records
    : records.filter((r) => getOverallStatus(r) === filterStatus);


  // Summary stats
  const totalTests = records.length;
  const passed = records.filter((r) => getOverallStatus(r) === 'pass').length;
  const failed = records.filter((r) => getOverallStatus(r) === 'fail').length;
  const warnings = records.filter((r) => getOverallStatus(r) === 'warning').length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TestTube className="w-7 h-7 text-aquro-500" />
            Water Quality Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            NABL standard parameters — track every water test report here.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-xl shadow-md shadow-aquro-500/30 hover:shadow-lg hover:scale-105 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Test Report
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', value: totalTests, icon: FlaskConical, color: 'from-aquro-500 to-aquro-400', light: 'bg-aquro-50 text-aquro-600' },
          { label: 'Passed', value: passed, icon: ShieldCheck, color: 'from-emerald-500 to-emerald-400', light: 'bg-emerald-50 text-emerald-600' },
          { label: 'Failed', value: failed, icon: XCircle, color: 'from-red-500 to-red-400', light: 'bg-red-50 text-red-600' },
          { label: 'Warnings', value: warnings, icon: AlertTriangle, color: 'from-amber-500 to-amber-400', light: 'bg-amber-50 text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4 hover:border-aquro-300 transition-colors">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${s.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pass', 'warning', 'fail'].map((f) => {
          const labels = { all: 'All Tests', pass: 'Passed', warning: 'Warning', fail: 'Failed' };
          const colors = {
            all: 'bg-slate-800 text-white',
            pass: 'bg-emerald-500 text-white',
            warning: 'bg-amber-500 text-white',
            fail: 'bg-red-500 text-white',
          };
          return (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filterStatus === f ? colors[f] + ' shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {labels[f]}
            </button>
          );
        })}
        <span className="ml-auto text-sm text-slate-400">{filtered.length} record(s)</span>
      </div>

      {/* ── Records List ── */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-aquro-50 flex items-center justify-center mb-4">
            <TestTube className="w-8 h-8 text-aquro-400" />
          </div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">Koi test record nahi mila</h3>
          <p className="text-slate-400 text-sm">"Add Test Report" button se naya report add karein.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const overall = getOverallStatus(record);
            const cfg = STATUS_CONFIG[overall];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === record.id;

            return (
              <div key={record.id} className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden transition-all`}>
                {/* Card Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{record.sampleId}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {record.date}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3 h-3" /> {record.source}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> By: {record.testedBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadPDF(record); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-aquro-600 hover:bg-aquro-50 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setForm(record); setShowModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Parameters */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                      {PARAMETERS.map((param) => {
                        const val = record[param.key];
                        const status = getParamStatus(param.key, val);
                        const pCfg = STATUS_CONFIG[status];
                        return (
                          <div key={param.key} className={`bg-white rounded-xl border ${pCfg.border} p-3 flex flex-col gap-1`}>
                            <p className="text-xs text-slate-500 font-medium leading-tight">
                              {param.icon} {param.label}
                            </p>
                            <p className="text-base font-bold text-slate-800">
                              {val !== '' && val !== undefined && val !== null ? val : '—'}
                              {val !== '' && val !== undefined && val !== null && param.unit ? (
                                <span className="text-xs font-normal text-slate-400 ml-1">{param.unit}</span>
                              ) : null}
                            </p>
                            <span className={`text-xs font-semibold ${pCfg.color}`}>{pCfg.label}</span>
                            <p className="text-xs text-slate-400">
                              Limit: {param.key === 'coliform' ? '0' : `${param.min}–${param.max}`}
                              {param.unit ? ` ${param.unit}` : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {record.remarks && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-600"><span className="font-semibold">Remarks:</span> {record.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Test Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-aquro-600 to-aquro-500 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                New Water Quality Test Report
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sample ID *
                  </label>
                  <input
                    name="sampleId"
                    value={form.sampleId}
                    onChange={handleChange}
                    placeholder="e.g. WQ-2025-001"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sample Source
                  </label>
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent"
                  >
                    <option>RO Plant Output</option>
                    <option>Pre-RO Input</option>
                    <option>Borewell</option>
                    <option>Final Product Sample</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tested By *
                  </label>
                  <input
                    name="testedBy"
                    value={form.testedBy}
                    onChange={handleChange}
                    placeholder="e.g. Lab Technician Name"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Batch Number (auto-filled from Production, readonly if pre-filled) */}
              {form.batchNumber && (
                <div className="bg-aquro-50 border border-aquro-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-aquro-600 uppercase tracking-wider">Batch #</span>
                  <span className="text-sm font-bold text-slate-800">{form.batchNumber}</span>
                  <span className="text-xs text-slate-400 ml-auto">Auto-linked from Production</span>
                </div>
              )}

              {/* Parameters */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Physical &amp; Chemical Parameters
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PARAMETERS.filter(p => !p.isMicro).map((param) => (
                    <div key={param.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {param.icon} {param.label}
                      </label>
                      <input
                        type="number"
                        name={param.key}
                        value={form[param.key]}
                        onChange={handleChange}
                        step="any"
                        placeholder={`Max: ${param.max}${param.unit ? ' ' + param.unit : ''}`}
                        className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent"
                      />
                      {form[param.key] !== '' && (
                        <span className={`text-xs font-semibold mt-1 block ${STATUS_CONFIG[getParamStatus(param.key, form[param.key])].color}`}>
                          {STATUS_CONFIG[getParamStatus(param.key, form[param.key])].label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Microbiological Parameters */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Microbiological Parameters
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PARAMETERS.filter(p => p.isMicro).map((param) => (
                    <div key={param.key} className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {param.icon} {param.label}
                      </label>
                      <input
                        type="text"
                        name={param.key}
                        value={form[param.key]}
                        onChange={handleChange}
                        placeholder="Absent / ND / Present"
                        className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                      {form[param.key] !== '' && (
                        <span className={`text-xs font-semibold mt-1 block ${STATUS_CONFIG[getParamStatus(param.key, form[param.key])].color}`}>
                          {STATUS_CONFIG[getParamStatus(param.key, form[param.key])].label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Koi additional observation ya notes likhein..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-aquro-400 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={handleSaveDefaults}
                className="px-4 py-2 text-aquro-600 hover:bg-aquro-100 rounded-xl text-sm font-semibold transition-colors"
              >
                Set as Default Values
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-aquro-600 to-aquro-500 text-white text-sm font-bold shadow-md shadow-aquro-500/30 hover:shadow-lg hover:scale-105 transition-all"
              >
                Save Test Report
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
