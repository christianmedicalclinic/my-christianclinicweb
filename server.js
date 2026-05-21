const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const app = express();

// ✅ FIXED PORT FOR VERCEL
const PORT = process.env.PORT || 3000;

// ------------------------
// MYSQL DATABASE CONNECTION
// ------------------------
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
db.query("SELECT 1", (err) => {
    if (err) console.log("MySQL connection error:", err);
    else console.log("MySQL pool ready");
});

// ------------------------
// Nodemailer Setup (FIXED)
// ------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function(error) {
    if (error) console.log('Email setup error:', error);
    else console.log('Email transporter ready');
});

// ------------------------
// MIDDLEWARE
// ------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ------------------------
// ROUTES
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
// BOOK APPOINTMENT (FIXED EMAIL)
// ------------------------
app.post('/book-appointment', async (req, res) => {

    const { fullname, email, phone, service, date, time } = req.body;

    if (!fullname || !email || !phone || !service || !date || !time) {
        return res.json({ message: "Please fill all fields" });
    }

    // STEP 1: DAILY LIMIT
    db.query(
        "SELECT COUNT(*) AS count FROM appointments WHERE date = ?",
        [date],
        (err, result) => {

            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            if (result[0].count >= 100) {
                return res.json({ message: "Fully booked for this date." });
            }

            // STEP 2: SLOT LIMIT
            db.query(
                "SELECT COUNT(*) AS count FROM appointments WHERE date = ? AND time = ?",
                [date, time],
                (err2, result2) => {

                    if (err2) {
                        return res.status(500).json({ message: "Database error" });
                    }

                    if (result2[0].count >= 12) {
                        return res.json({
                            message: `Slot ${time} is fully booked.`
                        });
                    }

                    // STEP 3: SAVE TO DATABASE
                    const sql = `
                        INSERT INTO appointments
                        (fullname, email, phone, service, date, time)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.query(sql,
                        [fullname, email, phone, service, date, time],
                        async (err3) => {

                            if (err3) {
                                return res.status(500).json({
                                    message: "Database error."
                                });
                            }

                            console.log("Appointment saved");

                            // STEP 4: SEND EMAIL (FIXED)
                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: email,
                                subject: 'Christian Medical Clinic Appointment Confirmation',
                                html: `
                                    <h3>Christian Medical Clinic</h3>
                                    <p>Dear ${fullname},</p>
                                    <p>Your appointment has been successfully booked.</p>

                                    <p><strong>Service:</strong> ${service}</p>
                                    <p><strong>Date:</strong> ${date}</p>
                                    <p><strong>Time:</strong> ${time}</p>

                                    <p>Thank you for choosing our clinic!</p>
                                `
                            };

                            try {
                                const info = await transporter.sendMail(mailOptions);

                                console.log("EMAIL SENT:", info.response);

                                return res.json({
                                    message: "Appointment booked + email sent!"
                                });

                            } catch (error) {
                                console.log("EMAIL ERROR:", error);

                                return res.json({
                                    message: "Booked but email failed."
                                });
                            }
                        }
                    );
                }
            );
        }
    );
});

// ------------------------
// GET APPOINTMENTS
// ------------------------
app.get('/appointments', (req, res) => {

    db.query("SELECT * FROM appointments", (err, results) => {

        if (err) {
            return res.status(500).json({ error: err });
        }

        res.json(results);
    });
});

// ------------------------
// DELETE APPOINTMENT
// ------------------------
app.delete('/delete-appointment/:id', (req, res) => {

    const appointmentId = req.params.id;

    db.query(
        "DELETE FROM appointments WHERE id = ?",
        [appointmentId],
        (err) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to delete appointment."
                });
            }

            res.json({
                message: "Appointment deleted successfully."
            });
        }
    );
});

// ------------------------
// VERCEL FIX
// ------------------------
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
