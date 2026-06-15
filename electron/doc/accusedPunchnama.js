const ACCUSED_PANCHNAMA_TEMPLATE = {
  document_type: 'accused_panchanama',

  police_station: 'CrimeGPT Police Station, Ahmedabad',

  fir: {
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
    sections: '',
  },

  panchnama: {
    date: '',
    time: '',
    place: '',
  },

  accused: {
    name: '',
    father_name: '',
    age: '',
    occupation: '',
    address: '',
    mobile_number: '',
  },

  identification_marks: {
    mark_1: '',
    mark_2: '',
  },

  clothes_worn: {
    upper_wear: '',
    lower_wear: '',
    footwear: '',
  },

  articles_found: {
    article_1: '',
    article_2: '',
    article_3: '',
    article_4: '',
  },

  panch_witnesses: [
    { name: '', address: '' },
    { name: '', address: '' },
  ],

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
    police_station: 'CrimeGPT Police Station, Ahmedabad',
  },
};

function renderAccusedPanchanama(data) {
  const d = JSON.parse(JSON.stringify(ACCUSED_PANCHNAMA_TEMPLATE));

  if (data) {
    if (data.police_station) d.police_station = data.police_station;
    if (data.fir) Object.assign(d.fir, data.fir);
    if (data.panchnama) Object.assign(d.panchnama, data.panchnama);
    if (data.accused) Object.assign(d.accused, data.accused);
    if (data.identification_marks) Object.assign(d.identification_marks, data.identification_marks);
    if (data.clothes_worn) Object.assign(d.clothes_worn, data.clothes_worn);
    if (data.articles_found) Object.assign(d.articles_found, data.articles_found);
    if (data.panch_witnesses && Array.isArray(data.panch_witnesses)) {
      data.panch_witnesses.forEach((w, i) => {
        if (d.panch_witnesses[i]) Object.assign(d.panch_witnesses[i], w);
      });
    }
    if (data.investigating_officer) Object.assign(d.investigating_officer, data.investigating_officer);
  }

  const val = (v) => v || '________________';

  const articles = [
    d.articles_found.article_1,
    d.articles_found.article_2,
    d.articles_found.article_3,
    d.articles_found.article_4,
  ].filter(Boolean);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">ACCUSED PANCHANAMA</h2>
        <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600;">POLICE STATION: ${val(d.police_station)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CASE INFORMATION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.fir_number)} / ${val(d.fir.fir_year)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.sections)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.panchnama.date)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Time</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.panchnama.time)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Place</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.panchnama.place)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ACCUSED DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name of Accused</td><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">${val(d.accused.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father's/Husband's Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.father_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.age)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Occupation</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.occupation)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.address)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mobile Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.mobile_number)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">IDENTIFICATION MARKS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mark 1</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.identification_marks.mark_1)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mark 2</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.identification_marks.mark_2)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CLOTHES WORN AT TIME OF ARREST</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Upper Wear</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.clothes_worn.upper_wear)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Lower Wear</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.clothes_worn.lower_wear)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Footwear</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.clothes_worn.footwear)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ARTICLES FOUND ON PERSONAL SEARCH</td></tr>
        ${articles.length > 0 
          ? articles.map((a, i) => `<tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Article ${i + 1}</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(a)}</td></tr>`).join('')
          : `<tr><td colspan="2" style="padding: 10px; border: 1px solid #ccc; text-align: center; color: #999;">No articles found</td></tr>`
        }

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">PANCH WITNESSES</td></tr>
        ${d.panch_witnesses.map((w, i) => `
          <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Witness ${i + 1}</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(w.name)}</td></tr>
          <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(w.address)}</td></tr>
        `).join('')}
      </table>

      <div style="margin-top: 20px; padding: 12px; border: 1px solid #ccc; background: #fafafa; font-size: 12px; line-height: 1.8;">
        <p style="margin: 0;">In the presence of the undersigned panch witnesses, the particulars of the accused were recorded as above. The above particulars were verified and found to be correct.</p>
        <p style="margin: 8px 0 0;">This Panchanama was read over and explained to the panch witnesses and the accused in Hindi/Gujarati, who admitted it to be correct and signed below.</p>
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
        <div style="text-align: center; flex: 1;">
          <p style="margin-bottom: 40px;">Signature/Thumb Impression</p>
          <p style="font-weight: 600;">Accused</p>
          <p>${val(d.accused.name)}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px;">
        <div style="text-align: center; flex: 1;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Panch Witness No. 1</p>
          <p>${val(d.panch_witnesses[0]?.name)}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 600;">Panch Witness No. 2</p>
          <p>${val(d.panch_witnesses[1]?.name)}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 12px;">
        <p style="margin-bottom: 40px;">Signature: ________________</p>
        <p style="font-weight: 700;">${val(d.investigating_officer.rank)} ${val(d.investigating_officer.name)}</p>
        <p>Investigating Officer</p>
        <p>${val(d.investigating_officer.police_station)}</p>
      </div>
    </div>
  `;
}

export { ACCUSED_PANCHNAMA_TEMPLATE, renderAccusedPanchanama };