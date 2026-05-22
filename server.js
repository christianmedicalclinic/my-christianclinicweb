const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------
// DATABASE (SUPABASE)
// ------------------------
const db = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: {
rejectUnauthorized: false
}
});

// TEST DB CONNECTION + ADD STATUS COLUMN IF NOT EXISTS
(async () => {
try {
await db.query('SELECT 1');
console.log('Database connected');

// ADD STATUS COLUMN IF IT DOESN'T EXIST YET
await db.query(`
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new'
`);
console.log('Status column ready');

} catch (err) {
console.log('DB ERROR:', err.message);
}
})();

// ------------------------
// BREVO EMAIL SETUP
// ------------------------
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

console.log("BREVO_API_KEY set:", !!process.env.BREVO_API_KEY);

// ------------------------
// MIDDLEWARE
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ------------------------
// ROUTES (PAGES)
// ------------------------
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/booking', (req, res) => {
res.sendFile(path.join(__dirname, 'booking.html'));
});

app.get('/services', (req, res) => {
res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/contact', (req, res) => {
res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/admin-login', (req, res) => {
res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// ------------------------
// BOOK APPOINTMENT
// (no auto email — admin confirms manually)
// ------------------------
app.post('/book-appointment', async (req, res) => {

console.log("BOOK REQUEST RECEIVED");

try {

const { fullname, email, phone, service, date, time } = req.body;

if (!fullname || !email || !phone || !service || !date || !time) {
return res.json({ message: "Please fill all fields" });
}

// DAILY LIMIT + SLOT LIMIT
const [countDay, countSlot] = await Promise.all([
db.query(
"SELECT COUNT(*) FROM appointments WHERE appointment_date = $1",
[date]
),
db.query(
"SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND time = $2",
[date, time]
)
]);

if (parseInt(countDay.rows[0].count) >= 100) {
return res.json({ message: "Fully booked for this date." });
}

if (parseInt(countSlot.rows[0].count) >= 12) {
return res.json({ message: "This time slot is fully booked." });
}

// INSERT INTO DATABASE (status defaults to 'new')
await db.query(
`INSERT INTO appointments
(fullname, email, phone, service, appointment_date, time, status)
VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
[fullname, email, phone, service, date, time]
);

console.log("Appointment inserted — waiting for admin confirmation");

return res.json({
message: "Appointment booked successfully! You will receive a confirmation email once the admin confirms your appointment."
});

} catch (err) {

console.log("FULL ERROR:", err.message);

return res.status(500).json({
message: "Server error: check logs"
});
}
});

// ------------------------
// GET APPOINTMENTS
// ------------------------
app.get('/appointments', async (req, res) => {

try {

const result = await db.query(
"SELECT * FROM appointments ORDER BY appointment_date ASC, time ASC"
);

res.json(result.rows);

} catch (err) {

console.log(err.message);

res.status(500).json({
message: "Failed to fetch appointments"
});
}
});

// ------------------------
// UPDATE APPOINTMENT STATUS
// (confirm or cancel — triggers email on both)
// ------------------------
app.patch('/update-appointment/:id', async (req, res) => {

try {

const { id } = req.params;
const { status } = req.body;

if (!['confirmed', 'cancelled'].includes(status)) {
return res.status(400).json({ message: "Invalid status." });
}

// GET APPOINTMENT DETAILS FIRST
const appt = await db.query(
"SELECT * FROM appointments WHERE id = $1",
[id]
);

if (appt.rows.length === 0) {
return res.status(404).json({ message: "Appointment not found." });
}

const { fullname, email, phone, service, appointment_date, time } = appt.rows[0];

// UPDATE STATUS
await db.query(
"UPDATE appointments SET status = $1 WHERE id = $2",
[status, id]
);

console.log(`Appointment ${id} marked as ${status}`);

const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "Christian Medical Clinic" };
sendSmtpEmail.to = [{ email: email.trim() }];

// EMAIL FOR CONFIRMED
if (status === 'confirmed') {

sendSmtpEmail.subject = "Appointment Confirmed - Christian Medical Clinic";
sendSmtpEmail.htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">

<div style="background:#0a8f08; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Christian Medical Clinic</h1>
</div>

<div style="padding: 30px;">
<h2 style="color: #0a8f08;">Appointment Confirmed ✅</h2>

<p>Dear <strong>${fullname}</strong>,</p>
<p>Your appointment has been reviewed and confirmed by our admin. Here are your details:</p>

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background:#f4f4f4;">
<td style="padding: 10px; font-weight: bold;">Service</td>
<td style="padding: 10px;">${service}</td>
</tr>
<tr>
<td style="padding: 10px; font-weight: bold;">Date</td>
<td style="padding: 10px;">${appointment_date}</td>
</tr>
<tr style="background:#f4f4f4;">
<td style="padding: 10px; font-weight: bold;">Time</td>
<td style="padding: 10px;">${time}</td>
</tr>
<tr>
<td style="padding: 10px; font-weight: bold;">Phone</td>
<td style="padding: 10px;">${phone}</td>
</tr>
</table>

<div style="background:#fff8e1; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; border-radius: 4px;">
<p style="margin:0; font-weight: bold;">⚠️ Important Reminders:</p>
<ul style="margin: 10px 0 0 20px;">
<li>Please arrive <strong>10-15 minutes before</strong> your scheduled time.</li>
<li>Late arrivals may result in your slot being given to the next patient.</li>
<li>Bring a valid ID and any relevant medical records.</li>
<li>If you need to cancel or reschedule, please call us at least <strong>1 day before</strong> your appointment.</li>
</ul>
</div>

<p>We look forward to seeing you on <strong>${appointment_date}</strong> at <strong>${time}</strong>.</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

<p style="margin:0;"><strong>Christian Medical Clinic</strong></p>
<p style="margin:0;">📞 901-5090 / 759-7116</p>
<p style="margin:0;">📧 christianmed.inc23@yahoo.com</p>
<p style="margin:0;">📍 22-B Madison Street, New Manila, Quezon City</p>
</div>

</div>
`;

// EMAIL FOR CANCELLED
} else if (status === 'cancelled') {

sendSmtpEmail.subject = "Appointment Cancellation Notice - Christian Medical Clinic";
sendSmtpEmail.htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">

<div style="background:#c0392b; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Christian Medical Clinic</h1>
</div>

<div style="padding: 30px;">
<h2 style="color: #c0392b;">Appointment Cancellation Notice ❌</h2>

<p>Dear <strong>${fullname}</strong>,</p>

<p>We regret to inform you that your appointment scheduled on <strong>${appointment_date}</strong> at <strong>${time}</strong> for <strong>${service}</strong> has been <strong>cancelled</strong>.</p>

<p>We sincerely apologize for any inconvenience this may have caused. Unfortunately, due to the unavailability of the attending physician or unforeseen circumstances on the said date and time, we were unable to accommodate your appointment as scheduled.</p>

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background:#f4f4f4;">
<td style="padding: 10px; font-weight: bold;">Service</td>
<td style="padding: 10px;">${service}</td>
</tr>
<tr>
<td style="padding: 10px; font-weight: bold;">Date</td>
<td style="padding: 10px;">${appointment_date}</td>
</tr>
<tr style="background:#f4f4f4;">
<td style="padding: 10px; font-weight: bold;">Time</td>
<td style="padding: 10px;">${time}</td>
</tr>
<tr>
<td style="padding: 10px; font-weight: bold;">Phone</td>
<td style="padding: 10px;">${phone}</td>
</tr>
</table>

<div style="background:#fdecea; border-left: 4px solid #c0392b; padding: 15px; margin: 20px 0; border-radius: 4px;">
<p style="margin:0; font-weight: bold;">📋 What you can do:</p>
<ul style="margin: 10px 0 0 20px;">
<li>Please visit our website or call our clinic to book a new appointment at your most convenient date and time.</li>
<li>Our staff will be happy to assist you in rescheduling as soon as possible.</li>
</ul>
</div>

<p>We value your trust in Christian Medical Clinic and we deeply apologize for this inconvenience. Rest assured that we are committed to providing you with the best possible care at the earliest opportunity.</p>

<p>Thank you for your kind understanding and patience.</p>

<p>Sincerely,<br><strong>Christian Medical Clinic Administration</strong></p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

<p style="margin:0;"><strong>Christian Medical Clinic</strong></p>
<p style="margin:0;">📞 901-5090 / 759-7116</p>
<p style="margin:0;">📧 christianmed.inc23@yahoo.com</p>
<p style="margin:0;">📍 22-B Madison Street, New Manila, Quezon City</p>
</div>

</div>
`;
}

// SEND THE EMAIL (fires for both confirmed and cancelled)
emailApi.sendTransacEmail(sendSmtpEmail)
.then(() => console.log(`${status.toUpperCase()} EMAIL SENT to`, email))
.catch(err => console.log("EMAIL ERROR:", err.message));

return res.json({ message: `Appointment ${status} successfully.` });

} catch (err) {

console.log(err.message);

res.status(500).json({ message: "Failed to update appointment." });
}
});

// ------------------------
// DELETE APPOINTMENT
// ------------------------
app.delete('/delete-appointment/:id', async (req, res) => {

try {

await db.query(
"DELETE FROM appointments WHERE id = $1",
[req.params.id]
);

res.json({
message: "Appointment deleted successfully"
});

} catch (err) {

console.log(err.message);

res.status(500).json({
message: "Delete failed"
});
}
});

// ------------------------
// START SERVER
// ------------------------
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
