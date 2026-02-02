const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite database
const db = new sqlite3.Database('./wedding_rsvp.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Create RSVP table
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            attending TEXT NOT NULL,
            adults INTEGER DEFAULT 1,
            children INTEGER DEFAULT 0,
            dietary TEXT,
            song TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('RSVP table ready');
        }
    });
}

// Configure email transporter
// IMPORTANT: Replace these with your actual email credentials
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'smtp.gmail.com' for direct SMTP
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password'      // Replace with your app password
    }
});

// Alternative SMTP configuration (for other email providers)
// const transporter = nodemailer.createTransport({
//     host: 'smtp.example.com',
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'your-email@example.com',
//         pass: 'your-password'
//     }
// });

// RSVP submission endpoint
app.post('/api/rsvp', async (req, res) => {
    const { name, email, phone, attending, adults, children, dietary, song, message } = req.body;

    // Validate required fields
    if (!name || !email || !attending) {
        return res.status(400).json({ error: 'Name, email, and attendance status are required' });
    }

    // Insert into database
    const sql = `
        INSERT INTO rsvps (name, email, phone, attending, adults, children, dietary, song, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [name, email, phone || null, attending, adults || 1, children || 0, dietary || null, song || null, message || null], 
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save RSVP' });
            }

            console.log(`RSVP saved with ID: ${this.lastID}`);

            // Send confirmation email
            sendConfirmationEmail(name, email, attending, adults, children)
                .then(() => {
                    res.json({ 
                        success: true, 
                        message: 'RSVP received successfully',
                        id: this.lastID 
                    });
                })
                .catch((emailErr) => {
                    console.error('Email error:', emailErr);
                    // Still return success since RSVP was saved
                    res.json({ 
                        success: true, 
                        message: 'RSVP received (email notification failed)',
                        id: this.lastID 
                    });
                });
        }
    );
});

// Send confirmation email
async function sendConfirmationEmail(name, email, attending, adults, children) {
    const isAttending = attending === 'yes';
    const guestCount = parseInt(adults || 1) + parseInt(children || 0);

    const mailOptions = {
        from: '"Sarah & Michael" <your-email@gmail.com>', // Replace with your email
        to: email,
        subject: isAttending ? '✓ RSVP Confirmed - Sarah & Michael\'s Wedding' : 'RSVP Received - Sarah & Michael\'s Wedding',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Georgia', serif;
                        background-color: #FAF7F2;
                        color: #2C3333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #9BA888, #C89F87);
                        padding: 40px 20px;
                        text-align: center;
                        color: white;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 32px;
                        font-weight: 300;
                        letter-spacing: 2px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .content h2 {
                        color: #9BA888;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    .content p {
                        line-height: 1.8;
                        margin-bottom: 15px;
                        font-size: 16px;
                    }
                    .details {
                        background: #FAF7F2;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 25px 0;
                    }
                    .details p {
                        margin: 8px 0;
                    }
                    .footer {
                        background: #2C3333;
                        color: #FAF7F2;
                        padding: 30px;
                        text-align: center;
                        font-size: 14px;
                    }
                    .divider {
                        height: 2px;
                        background: linear-gradient(90deg, transparent, #C89F87, transparent);
                        margin: 30px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Sarah & Michael</h1>
                        <p style="margin: 10px 0 0 0; letter-spacing: 3px; font-size: 14px;">JUNE 15, 2026</p>
                    </div>
                    <div class="content">
                        <h2>${isAttending ? 'We Can\'t Wait to See You!' : 'Thank You for Your Response'}</h2>
                        <p>Dear ${name},</p>
                        ${isAttending ? `
                            <p>Thank you for confirming your attendance at our wedding! We're absolutely thrilled that you'll be celebrating with us on our special day.</p>
                            <div class="details">
                                <p><strong>Your RSVP Details:</strong></p>
                                <p>Number of Guests: ${guestCount} (${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''})</p>
                            </div>
                            <p>We'll send you more details about the venue, timing, and other important information as the date approaches.</p>
                        ` : `
                            <p>Thank you for letting us know. We're sorry you won't be able to join us, but we completely understand. You'll be in our thoughts on the day!</p>
                        `}
                        <div class="divider"></div>
                        <p>If you need to make any changes to your RSVP, please don't hesitate to contact us at <a href="mailto:wedding@sarahandmichael.com" style="color: #9BA888;">wedding@sarahandmichael.com</a></p>
                        <p style="margin-top: 30px;">With love and gratitude,<br><strong>Sarah & Michael</strong></p>
                    </div>
                    <div class="footer">
                        <p>Sarah & Michael's Wedding</p>
                        <p>June 15, 2026</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    return transporter.sendMail(mailOptions);
}

// Get all RSVPs (for admin view)
app.get('/api/rsvps', (req, res) => {
    db.all('SELECT * FROM rsvps ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve RSVPs' });
        }
        res.json(rows);
    });
});

// Get RSVP statistics
app.get('/api/rsvp-stats', (req, res) => {
    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN attending = 'yes' THEN 1 ELSE 0 END) as attending,
            SUM(CASE WHEN attending = 'no' THEN 1 ELSE 0 END) as not_attending,
            SUM(CASE WHEN attending = 'yes' THEN adults ELSE 0 END) as total_adults,
            SUM(CASE WHEN attending = 'yes' THEN children ELSE 0 END) as total_children
        FROM rsvps
    `, [], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve statistics' });
        }
        res.json(row);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Wedding RSVP server running on http://localhost:${PORT}`);
    console.log(`Registry page: http://localhost:${PORT}/registry.html`);
    console.log(`RSVP page: http://localhost:${PORT}/rsvp.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
