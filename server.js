const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const app = express();

// PORT (Render uses process.env.PORT)
const PORT = process.env.PORT || 3000;

// ------------------------
// MYSQL DATABASE CONNECTION (SAFE)
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

// SAFE TEST (won’t crash deploy)
if (process.env.DB_HOST) {
    db.query("SELECT 1", (err) => {
        if (err) console.log("MySQL connection error:", err.message);
        else console.log("MySQL pool ready");
    });
}

// ------------------------
// Nodemailer Setup (SAFE)
// ------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SAFE VERIFY (won’t crash deploy)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify((error) => {
        if (error) console.log('Email setup error:', error.message);
        else console.log('Email transporter ready');
    });
}

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
// BOOK APPOINTMENT (UNCHANGED LOGIC)
// ------------------------
app.post('/book-appointment', async (req, res) => {

    const { fullname, email, phone, service, date, time } = req.body;

    if (!fullname || !email || !phone || !service || !date || !time) {
        return res.json({ message: "Please fill all fields" });
    }

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

                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: email,
                                subject: 'Appointment Confirmation',
                                html: `
                                    <h3>Appointment Confirmed</h3>
                                    <p><strong>Service:</strong> ${service}</p>
                                    <p><strong>Date:</strong> ${date}</p>
                                    <p><strong>Time:</strong> ${time}</p>
                                `
                            };

                            try {
                                await transporter.sendMail(mailOptions);

                                return res.json({
                                    message: "Appointment booked + email sent!"
                                });

                            } catch (error) {
                                console.log("EMAIL ERROR:", error.message);

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
            return res.status(500).json({ error: err.message });
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
// START SERVER (RENDER REQUIRED)
// ------------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
