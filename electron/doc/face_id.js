const FACE_ID_TEMPLATE = {
  document_type: 'accused_face_identification_form',

  police_station: 'CrimeGPT Police Station, Ahmedabad',

  fir: {
    fir_number: '',
    fir_year: new Date().getFullYear().toString(),
    sections: '',
    date: '',
  },

  photo_path: '',

  accused: {
    name: '',
    father_name: '',
    age: '',
    gender: '',
    occupation: '',
    address: '',
    mobile_number: '',
  },

  physical: {
    height: '',
    build: '',
    complexion: '',
    hair_description: '',
    eye_description: '',
    beard_moustache: '',
  },

  identification_marks: {
    mark_1: '',
    mark_2: '',
    mark_3: '',
  },

  arrest: {
    date: '',
    time: '',
    location: '',
  },

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
    police_station: 'CrimeGPT Police Station, Ahmedabad',
  },
};

function renderFaceIDForm(data) {
  const d = JSON.parse(JSON.stringify(FACE_ID_TEMPLATE));

  if (data) {
    if (data.police_station) d.police_station = data.police_station;
    if (data.fir) Object.assign(d.fir, data.fir);
    if (data.photo_path) d.photo_path = data.photo_path;
    if (data.accused) Object.assign(d.accused, data.accused);
    if (data.physical) Object.assign(d.physical, data.physical);
    if (data.identification_marks) Object.assign(d.identification_marks, data.identification_marks);
    if (data.arrest) Object.assign(d.arrest, data.arrest);
    if (data.investigating_officer) Object.assign(d.investigating_officer, data.investigating_officer);
  }

  const val = (v) => v || '________________';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">ACCUSED FACE IDENTIFICATION FORM</h2>
        <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600;">POLICE STATION: ${val(d.police_station)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">CASE INFORMATION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.fir_number)} / ${val(d.fir.fir_year)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Sections Applied</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.sections)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir.date)}</td></tr>

        <tr><td colspan="2" style="padding: 15px; border: 2px dashed #000; text-align: center; background: #fafafa;">
          <div style="width: 150px; height: 180px; border: 2px solid #ccc; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
            ${d.photo_path 
              ? `<img src="${d.photo_path}" style="max-width: 150px; max-height: 180px; object-fit: cover;" alt="Accused Photo" />`
              : `<span style="color: #999; font-size: 11px;">PHOTOGRAPH OF ACCUSED</span>`
            }
          </div>
          <p style="margin: 0; font-size: 10px; color: #666;">[ ACCUSED PHOTOGRAPH — Attach recent passport size photo ]</p>
        </td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">PERSONAL DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name of Accused</td><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">${val(d.accused.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Father's/Husband's Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.father_name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.age)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Gender</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.gender)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Occupation</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.occupation)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.address)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mobile Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.accused.mobile_number)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">PHYSICAL DESCRIPTION</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Height</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.height)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Build</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.build)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Complexion</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.complexion)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Hair Description</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.hair_description)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Eye Description</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.eye_description)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Beard / Moustache</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.physical.beard_moustache)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">IDENTIFICATION MARKS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mark 1</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.identification_marks.mark_1)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mark 2</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.identification_marks.mark_2)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Mark 3</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.identification_marks.mark_3)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">ARREST DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Arrest</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.arrest.date)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Time of Arrest</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.arrest.time)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Place of Arrest</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.arrest.location)}</td></tr>
      </table>

      <div style="margin-top: 20px; padding: 12px; border: 1px solid #ccc; background: #fafafa; font-size: 12px;">
        <p style="margin: 0;">This photograph and description are recorded for identification purposes during investigation. The above details were verified in the presence of the accused and found to be correct.</p>
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
        <div style="text-align: center; flex: 1;">
          <p style="margin-bottom: 40px;">Signature/Thumb Impression</p>
          <p style="font-weight: 600;">Accused</p>
          <p>${val(d.accused.name)}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <p style="margin-bottom: 40px;">Signature: ________________</p>
          <p style="font-weight: 700;">${val(d.investigating_officer.rank)} ${val(d.investigating_officer.name)}</p>
          <p>Investigating Officer</p>
          <p>${val(d.investigating_officer.police_station)}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 10px; font-size: 10px; color: #999;">
        <p>Date: ${val(d.fir.date)} | Place: ${val(d.investigating_officer.police_station)}</p>
      </div>
    </div>
  `;
}

export { FACE_ID_TEMPLATE, renderFaceIDForm };