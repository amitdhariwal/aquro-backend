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


// ─── Water Quality Parameters (Basic Lab Testable — IS 10500 / IS 14543) ──────
const PARAMETERS = [
  { key: 'ph',         label: 'pH Value',       unit: '',      min: 6.5, max: 8.5,  bisLimit: '6.5 – 8.5',   bestRange: '7.0 – 7.5' },
  { key: 'tds',        label: 'TDS',            unit: 'mg/L',  min: 0,   max: 500,  bisLimit: 'Max 500',     bestRange: '80 – 150'  },
  { key: 'turbidity',  label: 'Turbidity',      unit: 'NTU',   min: 0,   max: 1,    bisLimit: 'Max 1',       bestRange: '< 0.5'     },
  { key: 'hardness',   label: 'Total Hardness', unit: 'mg/L',  min: 0,   max: 200,  bisLimit: 'Max 200',     bestRange: '50 – 100'  },
  { key: 'calcium',    label: 'Calcium',        unit: 'mg/L',  min: 0,   max: 75,   bisLimit: 'Max 75',      bestRange: '20 – 40'   },
  { key: 'magnesium',  label: 'Magnesium',      unit: 'mg/L',  min: 0,   max: 30,   bisLimit: 'Max 30',      bestRange: '5 – 15'    },
  { key: 'alkalinity', label: 'Alkalinity',     unit: 'mg/L',  min: 0,   max: 200,  bisLimit: 'Max 200',     bestRange: '40 – 80'   },
  { key: 'chloride',   label: 'Chloride',       unit: 'mg/L',  min: 0,   max: 250,  bisLimit: 'Max 250',     bestRange: '< 50'      },
  { key: 'sulphate',   label: 'Sulphate',       unit: 'mg/L',  min: 0,   max: 200,  bisLimit: 'Max 200',     bestRange: '< 50'      },
  { key: 'nitrate',    label: 'Nitrate',        unit: 'mg/L',  min: 0,   max: 45,   bisLimit: 'Max 45',      bestRange: '< 10'      },
  { key: 'fluoride',   label: 'Fluoride',       unit: 'mg/L',  min: 0,   max: 1.0,  bisLimit: 'Max 1.0',     bestRange: '0.5 – 0.8' },
  { key: 'iron',       label: 'Iron',           unit: 'mg/L',  min: 0,   max: 0.3,  bisLimit: 'Max 0.3',     bestRange: '< 0.1'     },
];


function getParamStatus(key, value) {
  const p = PARAMETERS.find((x) => x.key === key);
  if (!p || value === '' || value === null || value === undefined) return 'unknown';
  
  const strVal = String(value).trim().toLowerCase();
  if (strVal === 'nt' || strVal === 'n/a' || strVal === 'not tested') return 'unknown';

  if (strVal === 'clear (visual)' || strVal === 'clear') return 'pass';

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

const HARDCODED_DEFAULTS = {
  ph: '7.8',
  tds: '71',
  turbidity: 'Clear (Visual)',
  hardness: '39.5',
  calcium: '10.8',
  magnesium: '3.1',
  alkalinity: '31.6',
  chloride: '18.2',
  sulphate: '8.4',
  nitrate: '0',
  fluoride: '0.1',
  iron: '0.1',
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
    testedBy: 'Amit Kumar',
    ...Object.fromEntries(PARAMETERS.map((p) => [p.key, defaults[p.key] !== undefined ? defaults[p.key] : (HARDCODED_DEFAULTS[p.key] || '')])),
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
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchRecords = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/water-quality');
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map(d => ({ ...d, id: d._id }));
        parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecords(parsed);
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Kya aap sach mein in ${selectedIds.length} records ko delete karna chahte hain?`)) {
      try {
        await Promise.all(selectedIds.map(id => 
          fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + `/api/water-quality/${id}`, { method: 'DELETE' })
        ));
        setSelectedIds([]);
        fetchRecords();
      } catch (error) {
        console.error(error);
        alert('Kuch records delete nahi ho paye.');
      }
    }
  };

  const generateReportHTML = (record) => {
    const overall = getOverallStatus(record);
    const overallCfg = STATUS_CONFIG[overall] || STATUS_CONFIG['pending'];
    const statusColors = { pass: '#059669', fail: '#dc2626', warning: '#d97706', pending: '#64748b', unknown: '#94a3b8' };

    const reportNo = `AQURO/WQ/${record.batchNumber || record.sampleId}/${new Date().getFullYear()}`;
    const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const samplingDate = record.date;
    const testedBy = record.testedBy || 'Amit Kumar';

    const TEST_METHODS = {
      ph: 'Digital pH Meter',
      tds: 'Digital TDS Meter',
      turbidity: 'Visual Inspection',
      hardness: 'BIONIX Reagent Kit (Titration Method)',
      calcium: 'BIONIX Reagent Kit (Colorimetric Method)',
      magnesium: 'BIONIX Reagent Kit (Colorimetric Method)',
      alkalinity: 'BIONIX Reagent Kit (Titration Method)',
      chloride: 'BIONIX Reagent Kit (Titration Method)',
      sulphate: 'BIONIX Reagent Kit (Colorimetric Method)',
      nitrate: 'BIONIX Reagent Kit (Colorimetric Method)',
      fluoride: 'BIONIX Reagent Kit (Colorimetric Method)',
      iron: 'BIONIX Reagent Kit (Colorimetric Method)',
    };

    const tableRows = PARAMETERS.map(p => {
      const rawVal = record[p.key];
      const strVal = rawVal !== undefined && rawVal !== null && rawVal !== '' ? String(rawVal).trim() : '';

      let displayVal, statusLabel, statusColor;
      if (strVal === '' || strVal.toLowerCase() === 'nt' || strVal.toLowerCase() === 'n/a') {
        displayVal = 'NT';
        statusLabel = 'NT';
        statusColor = '#94a3b8';
      } else {
        const isNum = !isNaN(parseFloat(rawVal));
        displayVal = `${strVal}${p.unit && isNum ? ' ' + p.unit : ''}`;
        const s = getParamStatus(p.key, rawVal);
        statusLabel = s === 'pass' ? 'PASS' : s === 'fail' ? 'FAIL' : s === 'warning' ? 'WARN' : 'NT';
        statusColor = statusColors[s] || '#94a3b8';
      }

      return `<tr>
        <td>${p.label}</td>
        <td style="text-align:center;">${p.bisLimit}</td>
        <td style="text-align:center;font-weight:600;">${displayVal}</td>
        <td style="text-align:center;font-size:9px;color:#475569;">${TEST_METHODS[p.key] || 'IS 3025'}</td>
        <td style="text-align:center;">
          <span style="display:inline-block;padding:1px 8px;border-radius:4px;font-weight:700;font-size:10px;color:#fff;background:${statusColor};">${statusLabel}</span>
        </td>
      </tr>`;
    }).join('');

    const testedCount = PARAMETERS.filter(p => {
      const v = String(record[p.key] || '').trim().toLowerCase();
      return v !== '' && v !== 'nt' && v !== 'n/a' && v !== 'not tested';
    }).length;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Water Quality Report — ${record.sampleId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color:#1e293b; background:#fff; font-size:10.5px; position: relative; z-index: 1; }
    .watermark { position:absolute; top:45%; left:50%; transform:translate(-50%, -50%) rotate(-40deg); font-size:160px; font-weight:900; color:rgba(14, 165, 233, 0.05); z-index:-1; pointer-events:none; white-space:nowrap; letter-spacing:15px; font-family:'Arial Black', Impact, sans-serif; text-transform:uppercase; user-select: none; }
    .page-header { background:#fff; color:#0f172a; padding:15px 18px; display:flex; align-items:center; justify-content:space-between; border-bottom: 3px solid #0f172a; }
    .company-info h1 { font-size:26px; font-weight:900; letter-spacing:1px; margin-bottom:4px; font-family: 'Arial Black', Impact, sans-serif; text-transform: uppercase; }
    .company-info p { font-size:10px; color:#475569; margin-top:2px; line-height:1.5; font-weight:600; }
    .report-meta { text-align:right; font-size:10px; color:#0f172a; font-weight:700; line-height:1.7; }
    .report-meta strong { font-size:13px; display:block; margin-bottom:3px; letter-spacing:0.5px; }
    .title-bar { background:#f0f9ff; border-bottom:2px solid #0ea5e9; padding:5px 18px; display:flex; align-items:center; justify-content:space-between; }
    .title-bar h2 { font-size:11.5px; font-weight:700; color:#0369a1; }
    .ref-std { font-size:8.5px; color:#64748b; }
    .body-wrap { padding:9px 18px; }
    .info-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px 12px; margin-bottom:9px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:8px 12px; }
    .info-item label { font-size:7.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.4px; }
    .info-item p { font-size:10px; font-weight:600; color:#0f172a; margin-top:1px; }
    .badge { display:inline-block; padding:1px 8px; border-radius:4px; font-size:9.5px; font-weight:700; color:#fff; }
    .section-title { font-size:9.5px; font-weight:700; color:#0369a1; text-transform:uppercase; letter-spacing:.6px; margin:8px 0 3px; padding-bottom:2px; border-bottom:1.5px solid #bae6fd; }
    table { width:100%; border-collapse:collapse; font-size:9.5px; }
    thead tr { background:#0369a1; color:#fff; }
    thead th { padding:4.5px 7px; text-align:left; font-weight:700; font-size:9px; }
    tbody tr:nth-child(even) { background:#f0f9ff; }
    tbody td { padding:3.5px 7px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
    .legend { margin-top:7px; background:#fffbeb; border:1px solid #fde68a; border-radius:4px; padding:5px 10px; font-size:8.5px; color:#78350f; }
    .disclaimer { margin-top:5px; background:#f8fafc; border:1px solid #e2e8f0; border-left:3px solid #0ea5e9; border-radius:4px; padding:5px 10px; font-size:8.5px; color:#475569; font-style:italic; }
    .remarks-box { background:#f8fafc; border:1px solid #e2e8f0; border-left:3px solid #0ea5e9; border-radius:4px; padding:6px 10px; margin-top:7px; }
    .remarks-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:3px 16px; }
    .remarks-item label { font-size:7.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; }
    .remarks-item p { font-size:9.5px; color:#1e293b; }
    .sig-section { margin-top:9px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .sig-box { border-top:1.5px solid #94a3b8; padding-top:5px; }
    .sig-box .sig-line { height:24px; border:1px dashed #cbd5e1; border-radius:3px; margin-bottom:4px; background:#f8fafc; }
    .sig-box label { font-size:7.5px; font-weight:700; color:#64748b; text-transform:uppercase; display:block; }
    .sig-box p { font-size:9.5px; color:#1e293b; font-weight:600; }
    .stamp-box { border:2px dashed #0ea5e9; border-radius:6px; width:75px; height:55px; display:flex; align-items:center; justify-content:center; color:#0ea5e9; font-size:7.5px; font-weight:700; text-align:center; }
    .page-footer { margin-top:9px; background:#f1f5f9; border-top:1.5px solid #e2e8f0; padding:5px 18px; display:flex; justify-content:space-between; align-items:center; }
    .page-footer span { font-size:7.5px; color:#94a3b8; }

    @page { size: A4 portrait; margin: 7mm; }
    @media print {
      body { font-size:9.5px; }
      .body-wrap { padding:6px 14px; }
      .info-grid { padding:5px 9px; }
      thead th { padding:3.5px 5px; }
      tbody td { padding:2.5px 5px; }
      .sig-section { margin-top:7px; }
    }
  </style>
</head>
<body>
  <div class="watermark">AQURO</div>

  <div class="page-header">
    <div class="company-info">
      <h1>M/S AQUR<span style="position:relative;display:inline-block;line-height:1;">O<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.4em;color:#0ea5e9;">💧</span></span> WATER</h1>
      <p>Jagua Khurd, Post Rajabpur, Amroha (U.P.) – 244236</p>
      <p>Mobile: 8449692599 &nbsp;|&nbsp; Premium Packaged Drinking Water</p>
    </div>
    <div class="report-meta">
      <strong>WATER QUALITY TEST REPORT</strong>
      Report No.: ${reportNo}<br/>
      Ref: IS 14543 &amp; IS 10500<br/>
      Page: 1 of 1 &nbsp;|&nbsp; Generated: ${samplingDate}
    </div>
  </div>

  <div class="title-bar">
    <h2>📋 Water Quality Analysis Report &mdash; Sample ID: ${record.sampleId}</h2>
    <div class="ref-std">IS 14543 (Packaged Drinking Water) &nbsp;|&nbsp; IS 10500 (Drinking Water Spec.)</div>
  </div>

  <div class="body-wrap">

    <div class="info-grid">
      <div class="info-item"><label>Sample ID</label><p>${record.sampleId}</p></div>
      <div class="info-item"><label>Batch No.</label><p>${record.batchNumber || '—'}</p></div>
      <div class="info-item"><label>Sampling Date</label><p>${samplingDate}</p></div>
      <div class="info-item"><label>Report Date</label><p>${samplingDate}</p></div>
      <div class="info-item"><label>Sample Source</label><p>${record.source || '—'}</p></div>
      <div class="info-item"><label>Tested By</label><p>___________________</p></div>
      <div class="info-item"><label>Params Tested</label><p>${testedCount} / ${PARAMETERS.length}</p></div>
      <div class="info-item"><label>Overall Result</label>
        <p><span class="badge" style="background:${statusColors[overall]};">${overallCfg.label}</span></p>
      </div>
    </div>

    <div class="section-title">Physical &amp; Chemical Parameters (as per IS 10500 / IS 14543)</div>
    <table>
      <thead><tr>
        <th style="width:23%;">Parameter</th>
        <th style="width:18%;text-align:center;">BIS Limit</th>
        <th style="width:17%;text-align:center;">Test Result</th>
        <th style="width:28%;text-align:center;">Test Method</th>
        <th style="width:14%;text-align:center;">Status</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="legend">
      <strong>Legend:</strong> &nbsp;
      <span style="color:#059669;font-weight:700;">PASS</span> = Within limit &nbsp;|&nbsp;
      <span style="color:#dc2626;font-weight:700;">FAIL</span> = Exceeds limit &nbsp;|&nbsp;
      <span style="color:#d97706;font-weight:700;">WARN</span> = Near limit (&lt;10% over) &nbsp;|&nbsp;
      <strong>NT</strong> = Not Tested this batch
    </div>

    <div class="disclaimer">
      This report is for internal quality monitoring only. Results are based on in-house tests conducted by qualified personnel. This is not a NABL-accredited third-party lab certificate.
    </div>

    <div class="remarks-box">
      <div class="remarks-grid">
        <div class="remarks-item"><label>Batch No.</label><p>${record.batchNumber || '—'}</p></div>
        <div class="remarks-item"><label>Sampling Date</label><p>${samplingDate}</p></div>
        <div class="remarks-item"><label>Testing Status</label><p>${overall === 'pass' ? '✅ All parameters passed' : overall === 'fail' ? '❌ Parameter(s) failed' : overall === 'warning' ? '⚠️ Near limit' : '🔵 Partial'}</p></div>
        ${record.remarks ? `<div class="remarks-item" style="grid-column:span 3;"><label>Notes</label><p>${record.remarks}</p></div>` : ''}
      </div>
    </div>

    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-line"></div>
        <label>Tested By</label>
        <p></p>
      </div>
      <div style="display:flex;align-items:flex-end;gap:10px;">
        <div class="sig-box" style="flex:1;">
          <div class="sig-line"></div>
          <label>Authorized Signatory</label>
          <p>___________________</p>
        </div>
        <div class="stamp-box">OFFICIAL<br/>STAMP</div>
      </div>
    </div>

  </div>

  <div class="page-footer">
    <span>M/S Aquro Water, Jagua Khurd, Amroha (U.P.) | Mobile: 8449692599</span>
    <span>Report No.: ${reportNo} &nbsp;|&nbsp; Page 1 of 1 &nbsp;|&nbsp; Confidential — Internal Use Only</span>
  </div>

</body>
</html>`;
    return html;
  };

  const handleDownloadPDF = (record) => {
    const html = generateReportHTML(record);
    const win = window.open('', '_blank', 'width=1000,height=780');
    if (!win) { alert('Popup blocked! Please allow popups for this site.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 700);
  };

  const handleBulkDownloadPDF = () => {
    if (selectedIds.length === 0) return;
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));
    const htmls = selectedRecords.map(r => generateReportHTML(r));
    const fullHtml = htmls.join('<div style="page-break-after: always;"></div>');
    
    const win = window.open('', '_blank', 'width=1000,height=780');
    if (!win) { alert('Popup blocked! Please allow popups for this site.'); return; }
    win.document.write(fullHtml);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 700 + (selectedRecords.length * 50));
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
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

      {/* ── Filter Bar & Bulk Actions ── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
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
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-aquro-600 focus:ring-aquro-500 cursor-pointer"
              checked={filtered.length > 0 && selectedIds.length === filtered.length}
              onChange={handleToggleSelectAll}
            />
            Select All
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={handleBulkDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-aquro-50 text-aquro-600 hover:bg-aquro-100 hover:text-aquro-700 rounded-lg text-sm font-semibold transition-colors border border-aquro-100"
              >
                <Download className="w-4 h-4" />
                Print ({selectedIds.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-semibold transition-colors border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
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
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-aquro-600 focus:ring-aquro-500 cursor-pointer"
                      checked={selectedIds.includes(record.id)}
                      onChange={(e) => handleToggleSelect(e, record.id)}
                    />
                  </div>
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
                        type="text"
                        name={param.key}
                        value={form[param.key]}
                        onChange={handleChange}
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
