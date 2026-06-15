const CUSTODY_LETTER_TEMPLATE = {
  document_type: 'judicial_custody_forwarding_letter',

  court_details: {
    court_name: 'The Honourable Judicial Magistrate First Class, Ahmedabad',
    court_order_date: '',
  },

  fir_details: {
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
  },

  custody: {
    custody_type: 'Judicial Custody',
    custody_period: '',
    jail_name: 'Sabarmati Central Jail, Ahmedabad',
  },

  escort_officer: {
    name: '',
    rank: '',
  },

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
  },
};

function renderCustodyLetter(data) {
  const d = JSON.parse(JSON.stringify(CUSTODY_LETTER_TEMPLATE));

  if (data) {
    if (data.court_details) Object.assign(d.court_details, data.court_details);
    if (data.fir_details) Object.assign(d.fir_details, data.fir_details);
    if (data.accused) Object.assign(d.accused, data.accused);
    if (data.custody) Object.assign(d.custody, data.custody);
    if (data.escort_officer) Object.assign(d.escort_officer, data.escort_officer);
    if (data.investigating_officer) Object.assign(d.investigating_officer, data.investigating_officer);
  }

  const val = (v) => v || '________________';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 700;">POLICE STATION: ${val(d.fir_details.police_station)}</h2>
        <h3 style="margin: 10px 0 0; font-size: 14px;">FORWARDING OF ACCUSED FOR JUDICIAL CUSTODY</h3>
        <p style="margin: 5px 0 0; font-size: 12px;">(Court Custody Letter)</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="font-size: 13px; font-weight: 600; margin-bottom: 5px;">To,</p>
        <p style="font-size: 13px; font-weight: 700;">The Superintendent,</p>
        <p style="font-size: 13px; font-weight: 700;">${val(d.custody.jail_name)}</p>
      </div>

      <p style="font-size: 13px; font-weight: 700; margin-bottom: 20px;">Subject: Forwarding of Accused for ${val(d.custody.custody_type)}</p>

      <p style="font-size: 12px; line-height: 2; margin-bottom: 20px;">Sir,</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CASE DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 35%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir_details.fir_number)} / ${val(d.fir_details.fir_year)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Police Station</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir_details.police_station)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir_details.sections)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Court</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.court_details.court_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Court Order Date</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.court_details.court_order_date)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ACCUSED DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father's Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.father_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.age)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.address)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CUSTODY DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Custody Type</td><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">${val(d.custody.custody_type)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Custody Period</td><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">${val(d.custody.custody_period)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Jail</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.custody.jail_name)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ESCORT DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Escort Officer</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.escort_officer.rank)} ${val(d.escort_officer.name)}</td></tr>
      </table>

      <div style="margin-top: 20px; padding: 12px; border: 1px solid #ccc; background: #fafafa; font-size: 12px; line-height: 2;">
        <p style="margin: 0;">The accused ${val(d.accused.name)}, S/o ${val(d.accused.father_name)}, Age ${val(d.accused.age)} years, resident of ${val(d.accused.address)}, arrested in connection with FIR No. ${val(d.fir_details.fir_number)}/${val(d.fir_details.fir_year)} registered at ${val(d.fir_details.police_station)} under Sections ${val(d.fir_details.sections)}, was produced before the ${val(d.court_details.court_name)} on ${val(d.court_details.court_order_date)}.</p>
        <p style="margin: 8px 0 0;">The Hon'ble Court has been pleased to remand the accused to ${val(d.custody.custody_type)} for a period of ${val(d.custody.custody_period)}.</p>
        <p style="margin: 8px 0 0;">You are therefore requested to admit the accused into your custody and make necessary entries as per jail rules.</p>
        <p style="margin: 8px 0 0;">The accused is being escorted by ${val(d.escort_officer.rank)} ${val(d.escort_officer.name)} along with the required documents and medical examination report.</p>
        <p style="margin: 8px 0 0;">Kindly acknowledge receipt.</p>
      </div>

      <div style="margin-top: 40px; font-size: 12px; line-height: 2;">
        <p>Yours faithfully,</p>
        <br/>
        <p>Signature: ________________</p>
        <p style="font-weight: 700;">${val(d.investigating_officer.rank)} ${val(d.investigating_officer.name)}</p>
        <p>Investigating Officer</p>
        <p>${val(d.fir_details.police_station)}</p>
      </div>

      <div style="margin-top: 30px; padding: 10px; border: 1px dashed #999; font-size: 11px;">
        <p style="font-weight: 600; margin: 0 0 5px;">ACKNOWLEDGMENT (To be returned to Police Station)</p>
        <p style="margin: 0;">Received the accused ${val(d.accused.name)} along with documents and medical report. Admitted to ${val(d.custody.jail_name)} on ________ at ________ hours.</p>
        <br/>
        <p style="margin: 0;">Signature: ________________</p>
        <p style="margin: 0;">Superintendent / Jailor</p>
        <p style="margin: 0;">${val(d.custody.jail_name)}</p>
      </div>
    </div>
  `;
}

export { CUSTODY_LETTER_TEMPLATE, renderCustodyLetter };