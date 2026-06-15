
const MEDICAL_LETTER_TEMPLATE = {
  document_type: 'medical_treatment_letter',
  police_station: 'CrimeGPT Police Station, Ahmedabad',
  fir_number: '',
  fir_date: '',

  victim: {
    name: '',
    age: '',
    gender: '',
    address: '',
  },

  incident: {
    date: '',
    time: '',
    place: '',
    brief_description: '',
  },

  injuries: {
    visible_injuries: '',
    weapon_used: '',
    condition_of_victim: '',
  },

  hospital: {
    hospital_name: 'Civil Hospital, Ahmedabad',
    doctor_name: 'The Medical Officer, Civil Hospital, Ahmedabad',
  },

  request: {
    medical_examination: true,
    injury_certificate: true,
    mlc_report: true,
  },

  investigating_officer: {
    name: '',
    rank: 'Investigating Officer',
    badge_number: '',
  },
};

function renderMedicalLetter(data) {
  const d = { ...MEDICAL_LETTER_TEMPLATE, ...data };
  d.victim = { ...MEDICAL_LETTER_TEMPLATE.victim, ...(data.victim || {}) };
  d.incident = { ...MEDICAL_LETTER_TEMPLATE.incident, ...(data.incident || {}) };
  d.injuries = { ...MEDICAL_LETTER_TEMPLATE.injuries, ...(data.injuries || {}) };
  d.hospital = { ...MEDICAL_LETTER_TEMPLATE.hospital, ...(data.hospital || {}) };
  d.request = { ...MEDICAL_LETTER_TEMPLATE.request, ...(data.request || {}) };
  d.investigating_officer = { ...MEDICAL_LETTER_TEMPLATE.investigating_officer, ...(data.investigating_officer || {}) };

  const val = (v) => v || '________________';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; background: white;">
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">POLICE STATION: ${val(d.police_station)}</h2>
        <h3 style="margin: 10px 0 0; font-size: 14px;">REQUEST FOR MEDICAL EXAMINATION & TREATMENT</h3>
        <p style="margin: 5px 0 0; font-size: 12px;">(Medico-Legal Case — MLC)</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">To,</td></tr>
        <tr><td colspan="2" style="padding: 10px; border: 1px solid #ccc; font-weight: 600;">${val(d.hospital.doctor_name)}</td></tr>
        <tr><td colspan="2" style="padding: 10px; border: 1px solid #ccc;">${val(d.hospital.hospital_name)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000; margin-top: 10px;">SUBJECT: REQUEST FOR MEDICAL EXAMINATION</td></tr>

        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; width: 40%; font-weight: 600;">FIR Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir_number)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">FIR Date</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.fir_date)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Police Station</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.police_station)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">VICTIM DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.victim.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Age</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.victim.age)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Gender</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.victim.gender)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Address</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.victim.address)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">INCIDENT DETAILS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Date of Incident</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.incident.date)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Time of Incident</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.incident.time)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Place of Incident</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.incident.place)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Brief Description</td><td style="padding: 8px 10px; border: 1px solid #ccc; line-height: 1.6; min-height: 60px;">${val(d.incident.brief_description)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">INJURIES REPORTED</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Visible Injuries</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.injuries.visible_injuries)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Weapon Used (if any)</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.injuries.weapon_used)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Condition of Victim</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.injuries.condition_of_victim)}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">REQUESTED EXAMINATIONS</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Medical Examination</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.request.medical_examination ? '✅ Required' : 'Not Required'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Injury Certificate</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.request.injury_certificate ? '✅ Required' : 'Not Required'}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">MLC Report</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${d.request.mlc_report ? '✅ Required' : 'Not Required'}</td></tr>

        <tr><td colspan="2" style="padding: 10px; background: #f0f0f0; font-weight: 700; font-size: 13px; border: 1px solid #000;">INVESTIGATING OFFICER</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Name</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.investigating_officer.name)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Rank</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.investigating_officer.rank)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ccc; font-weight: 600;">Badge Number</td><td style="padding: 8px 10px; border: 1px solid #ccc;">${val(d.investigating_officer.badge_number)}</td></tr>
      </table>

      <div style="margin-top: 30px; padding: 10px; border: 1px solid #ccc; background: #fafafa;">
        <p style="font-size: 12px; font-weight: 600;">Note to Medical Officer:</p>
        <p style="font-size: 12px;">Kindly examine the victim and provide a detailed medico-legal report including nature of injuries, weapon used (if determinable), approximate time of injury, and opinion on the cause of injuries. The MLC report should be sent to the undersigned in a sealed envelope at the earliest.</p>
      </div>

      <div style="margin-top: 40px; font-size: 12px; line-height: 2;">
        <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
        <p>Place: Ahmedabad</p>
        <br/>
        <p>Signature: ________________</p>
        <p>${val(d.investigating_officer.name)}</p>
        <p>${val(d.investigating_officer.rank)} (Badge: ${val(d.investigating_officer.badge_number)})</p>
        <p>${val(d.police_station)}</p>
      </div>
    </div>
  `;
}

export { MEDICAL_LETTER_TEMPLATE, renderMedicalLetter };