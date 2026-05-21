const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const app = express();

// ✅ FIXED PORT FOR VERCEL
const PORT = process.env.PORT || 3000;

// STORE APPOINTMENTS
let appointments = [];

// ------------------------
// MYSQL DATABASE CONNECTION
// ------------------------
// ⚠️ CHANGE THESE USING YOUR ONLINE MYSQL DATABASE
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
db.query("SELECT 1", (err, results) => {
    if (err) console.log("MySQL connection error:", err);
    else console.log("MySQL pool ready");
});

// ------------------------
// Nodemailer Setup
// ------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'christianmedicalclinic701@gmail.com',
        pass: process.env.EMAIL_PASS || 'YOUR_NEW_APP_PASSWORD'
    }
});

transporter.verify(function(error, success) {
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
// BOOK APPOINTMENT
// ------------------------
app.post('/book-appointment', async (req, res) => {

    const { fullname, email, phone, service, date, time } = req.body;

    if (!fullname || !email || !phone || !service || !date || !time) {
        return res.json({
            message: "Please fill all fields"
        });
    }

    // Limit 100 patients per date
    const dateAppointments = appointments.filter(app => app.date === date);

    if (dateAppointments.length >= 100) {
        return res.json({
            message: "Sorry, the clinic is fully booked for this date."
        });
    }

    // Limit 12 patients per time slot
    const slotAppointments = dateAppointments.filter(app => app.time === time);

    if (slotAppointments.length >= 12) {
        return res.json({
            message: `Sorry, the ${time} slot is fully booked.`
        });
    }

    const newAppointment = {
        fullname,
        email,
        phone,
        service,
        date,
        time
    };

    appointments.push(newAppointment);

    console.log("New Appointment:", newAppointment);

    // ------------------------
    // SAVE TO MYSQL DATABASE
    // ------------------------
    const sql = `
        INSERT INTO appointments
        (fullname, email, phone, service, date, time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [fullname, email, phone, service, date, time],
        async (err, result) => {

            if (err) {
                console.log("Database insert error:", err);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            console.log("Appointment saved to MySQL");

            // ------------------------
            // SEND CONFIRMATION EMAIL
            // ------------------------
            const mailOptions = {
                from: process.env.EMAIL_USER || 'christianmedicalclinic701@gmail.com',
                to: email,
                subject: 'Christian Medical Clinic Appointment Confirmation',
                html: `
                    <h3>Christian Medical Clinic</h3>
                    <p>Dear ${fullname},</p>
                    <p>Your appointment has been successfully booked with us.</p>

                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>

                    <p>Thank you for choosing our clinic!</p>
                `
            };

            try {

                await transporter.sendMail(mailOptions);

                console.log('Confirmation email sent to', email);

                res.json({
                    message: "Appointment booked successfully! Confirmation email sent."
                });

            } catch (error) {

                console.error('Email failed:', error);

                res.json({
                    message: "Appointment booked, but failed to send confirmation email."
                });
            }
        }
    );
});

// ------------------------
// SEND APPOINTMENTS TO DASHBOARD
// ------------------------
app.get('/appointments', (req, res) => {

    db.query("SELECT * FROM appointments", (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                error: err
            });
        }

        res.json(results);
    });
});

// ------------------------
// DELETE APPOINTMENT (ADMIN)
// ------------------------
app.delete('/delete-appointment/:id', (req, res) => {

    const appointmentId = req.params.id;

    const sql = "DELETE FROM appointments WHERE id = ?";

    db.query(sql, [appointmentId], (err, result) => {

        if (err) {

            console.log("Delete error:", err);

            return res.status(500).json({
                message: "Failed to delete appointment."
            });
        }

        res.json({
            message: "Appointment deleted successfully."
        });
    });
});

// ------------------------
// KEEP UPDATE APPOINTMENTS FOR IN-MEMORY (OPTIONAL)
// ------------------------
app.post('/update-appointments', (req, res) => {

    appointments = req.body;

    res.json({
        message: "Appointments updated successfully."
    });
});

// ------------------------
// START SERVER
// ------------------------
if (process.env.NODE_ENV !== 'production') {

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

}

// ✅ IMPORTANT FOR VERCEL
module.exports = app;
