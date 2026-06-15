const CHARGESHEET_TEMPLATE = {
  court_details: {
    court_name: 'The Honourable Judicial Magistrate First Class, Ahmedabad',
    district: 'Ahmedabad',
    case_number: '',
    submission_date: '',
    place: 'Ahmedabad',
  },
  police_station_details: {
    police_station: 'CrimeGPT Police Station, Ahmedabad',
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
  },
  complainant: {
    name: '',
    father_name: '',
    address: '',
    phone: '',
  },
  offence_details: {
    sections_applied: [],
    crime_type: '',
    date_of_occurrence: '',
    place_of_occurrence: '',
    brief_facts: '',
  },
  accused: [],
  property_details: {
    property_seized: [],
    property_value: '',
    property_status: 'In Police Custody',
  },
  investigation_details: {
    investigating_officer: '',
    date_of_arrest: '',
    date_of_charge_sheet: '',
    case_diary_reference: '',
    final_opinion: 'Sufficient evidence found to prosecute the accused. Charge sheet is being filed for judicial determination.',
  },
  witnesses: [],
  evidence: {
    documents: [],
    images: [],
    forensic_reports: [],
    medical_reports: [],
  },
  court_status: {
    accused_in_custody: false,
    released_on_bail: false,
    bail_bond_details: '',
    inquest_report_number: '',
  },
  appendices: [],
  certification: {
    officer_name: '',
    rank: 'Investigating Officer',
    police_station: 'CrimeGPT Police Station, Ahmedabad',
    signature: '',
    seal: 'CrimeGPT Police Station, Ahmedabad',
  },
};

function renderChargesheet(data) {
  const d = { ...CHARGESHEET_TEMPLATE, ...data };

  const formatSection = (label, value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.map((item, i) => {
        if (typeof item === 'object') {
          return Object.entries(item).map(([k, v]) => `${k}: ${v || 'N/A'}`).join(' | ');
        }
        return `${i + 1}. ${item}`;
      }).join('\n');
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value || '________________';
  };

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">POLICE STATION: ${d.police_station_details.police_station}</h2>
        <h3 style="margin: 10px 0 0; font-size: 14px;">CHARGE SHEET / FINAL REPORT</h3>
        <p style="margin: 5px 0 0; font-size: 12px;">Under Section 193 of BNSS 2023</p>
        <p style="margin: 8px 0 0; font-size: 13px;">IN THE COURT OF: ${d.court_details.court_name}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">1. CASE INFORMATION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.police_station_details.fir_number}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">FIR Year</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.police_station_details.fir_year}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Case Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.court_details.case_number)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Police Station</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.police_station_details.police_station}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">District</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.court_details.district}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Submission Date</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.court_details.submission_date || new Date().toLocaleDateString('en-IN'))}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">2. COMPLAINANT DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.complainant.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father/Husband Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.complainant.father_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.complainant.address)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Phone</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.complainant.phone)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">3. OFFENCE DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Crime Type</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.offence_details.crime_type)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.offence_details.sections_applied)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Occurrence</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.offence_details.date_of_occurrence)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Place of Occurrence</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.offence_details.place_of_occurrence)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Brief Facts</td><td style="padding: 8px 10px; border: 1px solid #ccc; line-height: 1.6; min-height: 80px;">${formatSection('', d.offence_details.brief_facts)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">4. ACCUSED DETAILS</td></tr>
  `;

  if (d.accused.length === 0) {
    html += `<tr><td colspan="2" style="padding: 8px 10px; border: 1px solid #ccc;">No accused details available</td></tr>`;
  } else {
    d.accused.forEach((a, i) => {
      html += `
        <tr><td colspan="2" style="padding: 6px 10px; background: #fafafa; font-weight: 600; border: 1px solid #ccc;">Accused #${i + 1}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.name || 'Unknown'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father's Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.father_name || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.age || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Gender</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.gender || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.address || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Custody Status</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.custody_status || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Bail Status</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${a.bail_status || 'N/A'}</td></tr>
      `;
    });
  }

  html += `
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">5. INVESTIGATION DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Investigating Officer</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.investigation_details.investigating_officer)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Arrest</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.investigation_details.date_of_arrest)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Charge Sheet</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.investigation_details.date_of_charge_sheet || new Date().toLocaleDateString('en-IN'))}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Final Opinion</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.investigation_details.final_opinion)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">6. CERTIFICATION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Officer Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.certification.officer_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Rank</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.certification.rank)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Police Station</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${formatSection('', d.certification.police_station)}</td></tr>
      </table>

      <div style="margin-top: 40px; font-size: 12px; line-height: 2;">
        <p>Date: ${d.court_details.submission_date || new Date().toLocaleDateString('en-IN')}</p>
        <p>Place: ${d.court_details.place || 'Ahmedabad'}</p>
        <br/>
        <p>Signature: ________________</p>
        <p>${d.certification.officer_name || '________________'}</p>
        <p>${d.certification.rank || 'Investigating Officer'}</p>
        <p style="margin-top: 10px;">(Seal)</p>
        <p>${d.certification.seal || 'CrimeGPT Police Station, Ahmedabad'}</p>
      </div>
    </div>
  `;

  return html;
}

export { CHARGESHEET_TEMPLATE, renderChargesheet };