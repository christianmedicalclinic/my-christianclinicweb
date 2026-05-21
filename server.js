const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const { Resend } = require('resend');

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

// TEST DB CONNECTION
(async () => {
    try {
        await db.query('SELECT 1');
        console.log('Database connected');
    } catch (err) {
        console.log('DB ERROR:', err.message);
    }
})();

// ------------------------
// RESEND EMAIL SETUP
// ------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

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
// ------------------------
app.post('/book-appointment', async (req, res) => {

    console.log("BOOK REQUEST RECEIVED");

    try {

        const { fullname, email, phone, service, date, time } = req.body;

        if (!fullname || !email || !phone || !service || !date || !time) {
            return res.json({ message: "Please fill all fields" });
        }

        // DAILY LIMIT
        const countDay = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE appointment_date = $1",
            [date]
        );

        if (parseInt(countDay.rows[0].count) >= 100) {
            return res.json({ message: "Fully booked for this date." });
        }

        // SLOT LIMIT
        const countSlot = await db.query(
            "SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND time = $2",
            [date, time]
        );

        if (parseInt(countSlot.rows[0].count) >= 12) {
            return res.json({ message: "This time slot is fully booked." });
        }

        // INSERT INTO SUPABASE
        await db.query(
            `INSERT INTO appointments
            (fullname, email, phone, service, appointment_date, time)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [fullname, email, phone, service, date, time]
        );

        console.log("Appointment inserted");

        // ------------------------
        // EMAIL (RESEND)
        // ------------------------
        try {

            await resend.emails.send({
                from: "Clinic <onboarding@resend.dev>",
                to: email,
                subject: "Appointment Confirmation",
                html: `
                    <h2>Appointment Confirmed</h2>
                    <p><strong>Name:</strong> ${fullname}</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                `
            });

            console.log("EMAIL SENT SUCCESSFULLY");

        } catch (err) {
            console.log("EMAIL ERROR:", err.message);
        }

        return res.json({
            message: "Appointment booked successfully!"
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
            "SELECT * FROM appointments ORDER BY id DESC"
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
