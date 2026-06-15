// electron/services/document-templates.js

const FIR_TEMPLATE = {
  police_station: 'CrimeGPT Police Station, Ahmedabad',
  district: 'Ahmedabad',
  state: 'Gujarat',
  fir_number: '',
  fir_year: new Date().getFullYear().toString(),
  sections_applied: [],
  incident_date: '',
  incident_time: '',
  incident_location: '',
  incident_district: 'Ahmedabad',
  incident_state: 'Gujarat',
  description: '',
  description_lang: 'en',
  complainant: {
    full_name: '',
    father_name: '',
    address: '',
    phone: '',
    id_proof_type: '',
    id_proof_number: '',
  },
  accused: [],
  witnesses: [],
  seized_items: [],
  officer_name: '',
  officer_rank: 'Investigating Officer',
  officer_badge: '',
  registration_date: new Date().toLocaleDateString('en-IN'),
  registration_time: new Date().toLocaleTimeString('en-IN'),
};

function renderFIR(data) {
  const d = { ...FIR_TEMPLATE };
  if (data) {
    Object.keys(d).forEach(key => {
      if (data[key] !== undefined && typeof d[key] !== 'object') {
        d[key] = data[key];
      }
    });
    if (data.complainant) d.complainant = { ...FIR_TEMPLATE.complainant, ...data.complainant };
    if (data.accused) d.accused = data.accused;
    if (data.witnesses) d.witnesses = data.witnesses;
    if (data.seized_items) d.seized_items = data.seized_items;
  }

  const val = (v) => v || '_______________________';
  const sectionsText = Array.isArray(d.sections_applied) 
    ? d.sections_applied.map(s => typeof s === 'object' ? `${s.law || 'BNS'} ${s.section} - ${s.title || ''}` : s).join(', ') 
    : d.sections_applied;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 40px; }
  .header { text-align: center; border: 2px solid #000; padding: 15px; margin-bottom: 20px; }
  .header h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 2px; }
  .header h2 { font-size: 13px; margin-top: 5px; }
  .section { border: 1px solid #000; margin-bottom: 15px; }
  .section-title { background: #e8e8e8; padding: 8px 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; }
  .row { display: flex; border-bottom: 1px solid #ccc; }
  .row:last-child { border-bottom: none; }
  .label { width: 35%; padding: 8px 12px; font-weight: bold; font-size: 11px; border-right: 1px solid #ccc; background: #fafafa; }
  .value { width: 65%; padding: 8px 12px; font-size: 11px; min-height: 18px; }
  .full-row { padding: 12px; font-size: 11px; line-height: 1.8; min-height: 120px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-box { text-align: center; width: 45%; }
  .sig-line { border-bottom: 1px solid #000; margin: 40px 0 10px; }
  .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.03); pointer-events: none; z-index: -1; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="watermark">AHMEDABAD POLICE</div>

<div class="header">
  <h1>First Information Report (FIR)</h1>
  <h2>Under Section 173 of Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023</h2>
</div>

<div class="section">
  <div class="section-title">1. Police Station Details</div>
  <div class="row"><div class="label">Police Station</div><div class="value">${val(d.police_station)}</div></div>
  <div class="row"><div class="label">District</div><div class="value">${val(d.district)}</div></div>
  <div class="row"><div class="label">State</div><div class="value">${val(d.state)}</div></div>
  <div class="row"><div class="label">FIR Number</div><div class="value"><strong>${val(d.fir_number)} / ${val(d.fir_year)}</strong></div></div>
  <div class="row"><div class="label">Date & Time of Registration</div><div class="value">${val(d.registration_date)} at ${val(d.registration_time)}</div></div>
</div>

<div class="section">
  <div class="section-title">2. Incident Information</div>
  <div class="row"><div class="label">Date of Incident</div><div class="value">${val(d.incident_date)}</div></div>
  <div class="row"><div class="label">Time of Incident</div><div class="value">${val(d.incident_time)}</div></div>
  <div class="row"><div class="label">Place of Incident</div><div class="value">${val(d.incident_location)}</div></div>
  <div class="row"><div class="label">District</div><div class="value">${val(d.incident_district)}</div></div>
  <div class="row"><div class="label">State</div><div class="value">${val(d.incident_state)}</div></div>
  <div class="row"><div class="label">Language</div><div class="value">${val(d.description_lang === 'hi' ? 'हिन्दी' : d.description_lang === 'gu' ? 'ગુજરાતી' : 'English')}</div></div>
  <div class="row"><div class="label">Sections Applied</div><div class="value">${val(sectionsText)}</div></div>
</div>

<div class="section">
  <div class="section-title">3. Complainant / Informant Details</div>
  <div class="row"><div class="label">Full Name</div><div class="value"><strong>${val(d.complainant.full_name)}</strong></div></div>
  <div class="row"><div class="label">Father's / Husband's Name</div><div class="value">${val(d.complainant.father_name)}</div></div>
  <div class="row"><div class="label">Address</div><div class="value">${val(d.complainant.address)}</div></div>
  <div class="row"><div class="label">Phone Number</div><div class="value">${val(d.complainant.phone)}</div></div>
  <div class="row"><div class="label">ID Proof Type</div><div class="value">${val(d.complainant.id_proof_type)}</div></div>
  <div class="row"><div class="label">ID Proof Number</div><div class="value">${val(d.complainant.id_proof_number)}</div></div>
</div>

${d.accused.length > 0 ? `
<div class="section">
  <div class="section-title">4. Accused Person(s) Details</div>
  ${d.accused.map((a, i) => `
    <div style="padding: 8px 12px; background: #f0f0f0; font-weight: bold; font-size: 10px; border-bottom: 1px solid #ccc;">Accused #${i + 1}</div>
    <div class="row"><div class="label">Name</div><div class="value"><strong>${val(a.full_name || a.name)}</strong></div></div>
    <div class="row"><div class="label">Alias / Nickname</div><div class="value">${val(a.alias)}</div></div>
    <div class="row"><div class="label">Father's Name</div><div class="value">${val(a.father_name)}</div></div>
    <div class="row"><div class="label">Age</div><div class="value">${val(a.age)}</div></div>
    <div class="row"><div class="label">Gender</div><div class="value">${val(a.gender)}</div></div>
    <div class="row"><div class="label">Address</div><div class="value">${val(a.address)}</div></div>
    <div class="row"><div class="label">Physical Description</div><div class="value">${val(a.physical_description)}</div></div>
  `).join('')}
</div>
` : ''}

${d.witnesses.length > 0 ? `
<div class="section">
  <div class="section-title">5. Witness(es) Details</div>
  ${d.witnesses.map((w, i) => `
    <div class="row"><div class="label">Witness ${i + 1} Name</div><div class="value">${val(w.full_name || w.name)}</div></div>
    <div class="row"><div class="label">Phone</div><div class="value">${val(w.phone)}</div></div>
    <div class="row"><div class="label">Statement</div><div class="value">${val(w.statement)}</div></div>
    ${i < d.witnesses.length - 1 ? '<div style="border-bottom: 1px dashed #ccc; margin: 5px 0;"></div>' : ''}
  `).join('')}
</div>
` : ''}

<div class="section">
  <div class="section-title">${d.witnesses.length > 0 ? '6' : d.accused.length > 0 ? '5' : '4'}. Incident Description</div>
  <div class="full-row">
    <p>${val(d.description)}</p>
  </div>
</div>

${d.seized_items.length > 0 ? `
<div class="section">
  <div class="section-title">7. Seized / Recovered Items</div>
  ${d.seized_items.map((item, i) => `
    <div class="row"><div class="label">Item ${i + 1}</div><div class="value">${val(item.item || item.item_name)}</div></div>
    <div class="row"><div class="label">Quantity</div><div class="value">${val(item.qty || item.quantity)}</div></div>
    <div class="row"><div class="label">Seized From</div><div class="value">${val(item.seized_from || item.seizedFrom)}</div></div>
    ${i < d.seized_items.length - 1 ? '<div style="border-bottom: 1px dashed #ccc; margin: 5px 0;"></div>' : ''}
  `).join('')}
</div>
` : ''}

<div class="section">
  <div class="section-title">Action Taken</div>
  <div class="full-row">
    <p>FIR registered and investigation taken up. Complainant copy of FIR provided. Investigation entrusted to ${val(d.officer_rank)} ${val(d.officer_name)}. Necessary legal action being taken as per law.</p>
  </div>
</div>

<div class="signature-area">
  <div class="sig-box">
    <div class="sig-line"></div>
    <p><strong>Signature / Thumb Impression of Complainant</strong></p>
    <p>${val(d.complainant.full_name)}</p>
  </div>
  <div class="sig-box">
    <div class="sig-line"></div>
    <p><strong>Investigating Officer</strong></p>
    <p>${val(d.officer_rank)} ${val(d.officer_name)}</p>
    <p>Badge: ${val(d.officer_badge)}</p>
  </div>
</div>

<div class="footer">
  <p>This FIR is registered under Section 173 of BNSS 2023. A copy has been provided to the complainant free of cost.</p>
  <p>Police Station: ${val(d.police_station)} | District: ${val(d.district)} | State: ${val(d.state)}</p>
  <p>Generated by CrimeGPT — Offline Police Documentation System</p>
</div>

</body>
</html>`;
}

export { FIR_TEMPLATE, renderFIR };