const { Resend } = require('resend');

const sendMarathonEmail = async (participant) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Vivek University <onboarding@resend.dev>',
      to: 'digiihelpdesk@vivekuniversity.ac.in',
      subject: `Registration Confirmed — ${participant.formNo} | Vivek Marathon 2026`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <div style="background:#0d1b3e;padding:24px;text-align:center;">
            <h1 style="color:#f4c430;margin:0;">🏃 VIVEK MARATHON 2026</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Run for Health · Bijnor · 07 April 2026</p>
          </div>
          <div style="padding:30px;">
            <h3 style="color:#0d1b3e;">Dear ${participant.fullName},</h3>
            <p>Your registration has been received successfully! 🎉</p>
            <div style="background:#f0f4ff;border-left:4px solid #0d1b3e;padding:16px;margin:20px 0;">
              <p><strong>Form No:</strong> ${participant.formNo}</p>
              <p><strong>Name:</strong> ${participant.fullName}</p>
              <p><strong>Mobile:</strong> ${participant.mobile}</p>
              <p><strong>T-Shirt:</strong> ${participant.tshirt}</p>
              <p><strong>Payment:</strong> ${participant.paymentStatus}</p>
            </div>
            <div style="background:#0d1b3e;color:white;padding:16px;border-radius:8px;text-align:center;">
              <p>📍 Nehru Stadium, Bijnor</p>
              <p>📅 07 April 2026 | ⏰ 6:00 AM</p>
            </div>
          </div>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    console.log('✅ Email sent:', data.id);
    return data;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    throw err;
  }
};

module.exports = { sendMarathonEmail };