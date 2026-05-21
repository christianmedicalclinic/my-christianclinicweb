const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// SAFE DB TEST
(async () => {
    try {
        await db.query("SELECT 1");
        console.log("Database connected");
    } catch (err) {
        console.log("DB error:", err.message);
    }
})();

// EMAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, 'booking.html')));

// BOOK APPOINTMENT
app.post('/book-appointment', async (req, res) => {

    const { fullname, email, phone, service, date, time } = req.body;

    if (!fullname || !email || !phone || !service || !date || !time) {
        return res.json({ message: "Please fill all fields" });
    }

    try {

        // IMPORTANT FIX: use "appointment_date" (NOT "date")
        const countDay = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE appointment_date = $1",
            [date]
        );

        if (parseInt(countDay.rows[0].count) >= 100) {
            return res.json({ message: "Fully booked for this date." });
        }

        const countSlot = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND time = $2",
            [date, time]
        );

        if (parseInt(countSlot.rows[0].count) >= 12) {
            return res.json({ message: "Slot is fully booked." });
        }

        // INSERT FIXED
        await db.query(
            `INSERT INTO appointments (fullname, email, phone, service, appointment_date, time)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [fullname, email, phone, service, date, time]
        );

        // EMAIL
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Appointment Confirmation",
            html: `<h3>Appointment Confirmed</h3>
                   <p>${service}</p>
                   <p>${date} at ${time}</p>`
        });

        return res.json({ message: "Booked successfully + email sent!" });

    } catch (err) {
        console.log("FULL ERROR:", err.message);
        return res.status(500).json({ message: "Server error: check logs" });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
