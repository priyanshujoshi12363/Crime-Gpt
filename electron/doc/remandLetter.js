const REMAND_LETTER_TEMPLATE = {
  document_type: 'police_custody_remand_request',

  court: {
    court_name: 'The Honourable Judicial Magistrate First Class, Ahmedabad',
    district: 'Ahmedabad',
  },

  subject: 'Application for Police Custody Remand',

  fir: {
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
    police_station: 'CrimeGPT Police Station, Ahmedabad',
    sections: '',
  },

  accused: {
    name: '',
    father_name: '',
    age: '',
    address: '',
    arrest_date: '',
  },

  investigation: {
    pending_recovery: '',
    pending_weapon_recovery: '',
    pending_co_accused_identification: '',
    pending_digital_evidence: '',
    additional_interrogation_reason: '',
  },

  remand: {
    requested_days: '14',
    grounds: '',
  },

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
    police_station: 'CrimeGPT Police Station, Ahmedabad',
  },
};

function renderRemandLetter(data) {
  const d = JSON.parse(JSON.stringify(REMAND_LETTER_TEMPLATE));
  
  if (data) {
    if (data.court) { d.court.court_name = data.court.court_name || d.court.court_name; d.court.district = data.court.district || d.court.district; }
    if (data.fir) Object.assign(d.fir, data.fir);
    if (data.accused) Object.assign(d.accused, data.accused);
    if (data.investigation) Object.assign(d.investigation, data.investigation);
    if (data.remand) Object.assign(d.remand, data.remand);
    if (data.investigating_officer) Object.assign(d.investigating_officer, data.investigating_officer);
  }

  const val = (v) => v || '________________';

  const buildGrounds = () => {
    const reasons = [];
    if (d.investigation.pending_recovery) reasons.push(`the ${d.investigation.pending_recovery} has not yet been recovered`);
    if (d.investigation.pending_weapon_recovery) reasons.push(`the weapon used (${d.investigation.pending_weapon_recovery}) is yet to be recovered`);
    if (d.investigation.pending_co_accused_identification) reasons.push(`co-accused persons need to be identified (${d.investigation.pending_co_accused_identification})`);
    if (d.investigation.pending_digital_evidence) reasons.push(`digital evidence needs to be collected (${d.investigation.pending_digital_evidence})`);
    if (d.investigation.additional_interrogation_reason) reasons.push(d.investigation.additional_interrogation_reason);
    if (d.remand.grounds) reasons.push(d.remand.grounds);
    
    if (reasons.length === 0) return 'further investigation and interrogation is required to complete the investigation';
    return reasons.join('. ') + '.';
  };

  const groundsText = buildGrounds();

  const bodyText = `The accused ${val(d.accused.name)} was arrested on ${val(d.accused.arrest_date)} in connection with FIR No. ${val(d.fir.fir_number)}/${val(d.fir.fir_year)} registered at ${val(d.fir.police_station)} under Sections ${val(d.fir.sections)} of Bharatiya Nyaya Sanhita. During investigation it has been revealed that ${groundsText} Therefore, it is respectfully requested that police custody remand of the accused for ${val(d.remand.requested_days)} days be granted for effective investigation.`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">POLICE STATION: ${val(d.fir.police_station)}</h2>
        <h3 style="margin: 10px 0 0; font-size: 14px;">APPLICATION FOR POLICE CUSTODY REMAND</h3>
        <p style="margin: 5px 0 0; font-size: 12px;">Under Section 187 of BNSS 2023</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="font-size: 13px; font-weight: 600; margin-bottom: 5px;">To,</p>
        <p style="font-size: 13px; font-weight: 700;">${val(d.court.court_name)}</p>
        <p style="font-size: 13px;">${val(d.court.district)}</p>
      </div>

      <p style="font-size: 13px; font-weight: 700; margin-bottom: 20px;">Subject: ${d.subject}</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CASE DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.fir_number)} / ${val(d.fir.fir_year)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Police Station</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.police_station)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.sections)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ACCUSED DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father's Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.father_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.age)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.address)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Arrest</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.arrest_date)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">GROUNDS FOR REMAND</td></tr>
        <tr><td colspan="2" style="padding: 10px; border: 1px solid #ccc; line-height: 1.8; font-size: 12px;">
          <p style="margin: 0;">${bodyText}</p>
        </td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">REMAND REQUEST</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Days Requested</td><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">${val(d.remand.requested_days)} Days Police Custody</td></tr>
      </table>

      <div style="margin-top: 30px; padding: 12px; border: 1px solid #ccc; background: #fafafa; font-size: 12px;">
        <p style="font-weight: 600; margin: 0 0 5px;">PRAYER:</p>
        <p style="margin: 0;">It is humbly prayed that this Honourable Court may be pleased to grant police custody remand of the accused for ${val(d.remand.requested_days)} days to enable the investigating officer to complete the investigation effectively.</p>
      </div>

      <div style="margin-top: 40px; font-size: 12px; line-height: 2;">
        <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
        <p>Place: ${val(d.court.district)}</p>
        <br/>
        <p>Signature: ________________</p>
        <p>${val(d.investigating_officer.name)}</p>
        <p>${val(d.investigating_officer.rank)}</p>
        <p>${val(d.investigating_officer.police_station)}</p>
      </div>
    </div>
  `;
}

export { REMAND_LETTER_TEMPLATE, renderRemandLetter };