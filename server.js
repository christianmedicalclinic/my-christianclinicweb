const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();

// PORT
const PORT = process.env.PORT || 3000;

// ------------------------
// POSTGRES (SUPABASE) CONNECTION
// ------------------------
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// SAFE CONNECTION TEST (DO NOT CRASH DEPLOY)
db.query("SELECT 1")
    .then(() => console.log("Database connected (Supabase)"))
    .catch(err => console.log("DB connection error:", err.message));

// ------------------------
// EMAIL SETUP
// ------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SAFE EMAIL CHECK
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify((error) => {
        if (error) console.log("Email error:", error.message);
        else console.log("Email ready");
    });
}

// ------------------------
// MIDDLEWARE
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ------------------------
// ROUTES (FRONTEND)
// ------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking.html'));
});

// ------------------------
// BOOK APPOINTMENT
// ------------------------
app.post('/book-appointment', async (req, res) => {

    const { fullname, email, phone, service, date, time } = req.body;

    if (!fullname || !email || !phone || !service || !date || !time) {
        return res.json({ message: "Please fill all fields" });
    }

    try {

        // DAILY LIMIT
        const countDay = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE date = $1",
            [date]
        );

        if (parseInt(countDay.rows[0].count) >= 100) {
            return res.json({ message: "Fully booked for this date." });
        }

        // SLOT LIMIT
        const countSlot = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE date = $1 AND time = $2",
            [date, time]
        );

        if (parseInt(countSlot.rows[0].count) >= 12) {
            return res.json({ message: `Slot ${time} is fully booked.` });
        }

        // INSERT APPOINTMENT
        await db.query(
            `INSERT INTO appointments (fullname, email, phone, service, date, time)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [fullname, email, phone, service, date, time]
        );

        // EMAIL
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Appointment Confirmation",
            html: `
                <h3>Appointment Confirmed</h3>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.json({ message: "Appointment booked + email sent!" });
        } catch (emailErr) {
            console.log("EMAIL ERROR:", emailErr.message);
            return res.json({ message: "Booked but email failed." });
        }

    } catch (err) {
        console.log("DB ERROR:", err.message);
        return res.status(500).json({ message: err.message });
    }
});

// ------------------------
// GET APPOINTMENTS
// ------------------------
app.get('/appointments', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM appointments ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.json({ message: "Appointment deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ------------------------
// START SERVER
// ------------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
