const SEIZURE_PANCHNAMA_TEMPLATE = {
  document_type: 'seizure_panchanama',

  police_station: 'CrimeGPT Police Station, Ahmedabad',

  fir: {
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
    sections: '',
  },

  seizure: {
    date: '',
    time: '',
    location: '',
  },

  panch_witnesses: [
    {
      name: '',
      address: '',
    },
    {
      name: '',
      address: '',
    },
  ],

  seized_items: [
    { item: '', description: '', quantity: '' },
  ],

  seal: {
    number: '',
    description: 'Official seal of Investigating Officer, CrimeGPT Police Station',
  },

  muddamal: {
    entry_number: '',
  },

  property: {
    recovered_from: '',
    recovery_location: '',
  },

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
    badge_number: '',
    police_station: 'CrimeGPT Police Station, Ahmedabad',
  },
};

function renderSeizurePanchanama(data) {
  const d = JSON.parse(JSON.stringify(SEIZURE_PANCHNAMA_TEMPLATE));

  if (data) {
    if (data.police_station) d.police_station = data.police_station;
    if (data.fir) Object.assign(d.fir, data.fir);
    if (data.seizure) Object.assign(d.seizure, data.seizure);
    if (data.panch_witnesses && Array.isArray(data.panch_witnesses)) {
      data.panch_witnesses.forEach((w, i) => {
        if (d.panch_witnesses[i]) Object.assign(d.panch_witnesses[i], w);
      });
    }
    if (data.seized_items && Array.isArray(data.seized_items)) {
      d.seized_items = data.seized_items.map(item => ({
        item: item.item || item.name || '',
        description: item.description || '',
        quantity: item.quantity || item.qty || '1',
      }));
    }
    if (data.seal) Object.assign(d.seal, data.seal);
    if (data.muddamal) Object.assign(d.muddamal, data.muddamal);
    if (data.property) Object.assign(d.property, data.property);
    if (data.investigating_officer) Object.assign(d.investigating_officer, data.investigating_officer);
  }

  const val = (v) => v || '________________';

  const seizedItemsHTML = d.seized_items.length > 0
    ? d.seized_items.map((item, i) => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #ccc; text-align: center;">${i + 1}</td>
        <td style="padding: 8px 10px; border: 1px solid #ccc;">${val(item.item)}</td>
        <td style="padding: 8px 10px; border: 1px solid #ccc;">${val(item.description)}</td>
        <td style="padding: 8px 10px; border: 1px solid #ccc; text-align: center;">${val(item.quantity)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4" style="padding: 10px; border: 1px solid #ccc; text-align: center;">No items listed</td></tr>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 700;">जप्ती पंचनामा / SEIZURE PANCHANAMA</h2>
        <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600;">POLICE STATION: ${val(d.police_station)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CASE INFORMATION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.fir_number)} / ${val(d.fir.fir_year)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.sections)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Seizure</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.seizure.date)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Time of Seizure</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.seizure.time)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Place of Seizure</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.seizure.location)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">PANCH WITNESSES</td></tr>
        ${d.panch_witnesses.map((w, i) => `
          <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Panch Witness ${i + 1}</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(w.name)}</td></tr>
          <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(w.address)}</td></tr>
        `).join('')}

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">SEIZED ARTICLES / PROPERTY</td></tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: -1px;">
        <tr style="background: #fafafa;">
          <th style="padding: 8px 10px; border: 1px solid #ccc; width: 8%;">Sr.</th>
          <th style="padding: 8px 10px; border: 1px solid #ccc; width: 30%;">Item Name</th>
          <th style="padding: 8px 10px; border: 1px solid #ccc; width: 50%;">Description</th>
          <th style="padding: 8px 10px; border: 1px solid #ccc; width: 12%;">Qty</th>
        </tr>
        ${seizedItemsHTML}
      </table>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: -1px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">SEAL DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">Seal Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.seal.number)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Seal Description</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.seal.description)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Muddamal Entry No.</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.muddamal.entry_number)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">PANCHANAMA STATEMENT</td></tr>
        <tr><td colspan="2" style="padding: 12px; border: 1px solid #ccc; line-height: 2; font-size: 12px;">
          <p style="margin: 0;">Today, in the presence of the above-mentioned panch witnesses, I, ${val(d.investigating_officer.rank)} ${val(d.investigating_officer.name)}, Investigating Officer of ${val(d.investigating_officer.police_station)}, conducted a seizure proceeding in connection with the above FIR No. ${val(d.fir.fir_number)}/${val(d.fir.fir_year)}.</p>
          <p style="margin: 8px 0 0;">During investigation, the above listed articles were found and seized from ${val(d.property.recovered_from)} at ${val(d.property.recovery_location || d.seizure.location)}.</p>
          <p style="margin: 8px 0 0;">The seized property was inspected in the presence of the panch witnesses, properly identified, packed, sealed with seal No. ${val(d.seal.number)}, and marked for investigation purposes. The seized articles have been taken into police custody and entered into the Muddamal Register at entry No. ${val(d.muddamal.entry_number)} for further investigation and production before the Hon'ble Court.</p>
          <p style="margin: 8px 0 0;">This Panchanama was read over and explained to the witnesses in Hindi/Gujarati, who admitted it to be correct and signed below.</p>
        </td></tr>
      </table>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
        <div style="text-align: center;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Panch Witness No. 1</p>
          <p>${val(d.panch_witnesses[0]?.name)}</p>
        </div>
        <div style="text-align: center;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Panch Witness No. 2</p>
          <p>${val(d.panch_witnesses[1]?.name)}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px;">
        <div style="text-align: center;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Person From Whom Property Seized</p>
          <p>${val(d.property.recovered_from)}</p>
        </div>
        <div style="text-align: center;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Investigating Officer</p>
          <p>${val(d.investigating_officer.rank)} ${val(d.investigating_officer.name)}</p>
          <p style="font-size: 11px;">Badge: ${val(d.investigating_officer.badge_number)}</p>
          <p style="font-size: 11px;">${val(d.investigating_officer.police_station)}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #666;">
        <p>Date: ${val(d.seizure.date)} | Place: ${val(d.seizure.location)}</p>
      </div>
    </div>
  `;
}

export { SEIZURE_PANCHNAMA_TEMPLATE, renderSeizurePanchanama };