const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

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
// GMAIL EMAIL SETUP
// ------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// VERIFY EMAIL CONFIG AT STARTUP
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS set:", !!process.env.EMAIL_PASS);

transporter.verify((error, success) => {
    if (error) {
        console.log("EMAIL CONFIG ERROR:", error.message);
    } else {
        console.log("Email server ready");
    }
});

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

        // DAILY LIMIT + SLOT LIMIT (run both at the same time)
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

        // INSERT INTO DATABASE
        await db.query(
            `INSERT INTO appointments
            (fullname, email, phone, service, appointment_date, time)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [fullname, email, phone, service, date, time]
        );

        console.log("Appointment inserted");

        // SEND EMAIL (background - don't make user wait)
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email.trim(),
            subject: "Appointment Confirmation",
            html: `
                <h2>Appointment Confirmed</h2>

                <p><strong>Name:</strong> ${fullname}</p>

                <p><strong>Service:</strong> ${service}</p>

                <p><strong>Date:</strong> ${date}</p>

                <p><strong>Time:</strong> ${time}</p>
            `
        })
        .then(() => console.log("EMAIL SENT SUCCESSFULLY"))
        .catch(err => console.log("EMAIL ERROR:", err.message));

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
