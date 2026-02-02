const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Configure email transporter with environment variables
console.log('🔧 Email Configuration:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error.message);
        console.error('   Emails will NOT be sent. Please check your EMAIL_USER and EMAIL_PASS environment variables.');
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

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
        async function(err) {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ error: 'Failed to save RSVP' });
            }

            console.log(`✅ RSVP saved with ID: ${this.lastID} for ${name} (${email})`);

            // Try to send confirmation email (but don't fail the RSVP if it doesn't work)
            try {
                await sendConfirmationEmail(name, email, attending, adults, children);
                console.log(`✅ Confirmation email sent to ${email}`);
                res.json({ 
                    success: true, 
                    message: 'RSVP received and confirmation email sent',
                    id: this.lastID 
                });
            } catch (emailErr) {
                console.error(`❌ Failed to send email to ${email}:`, emailErr.message);
                // Still return success since RSVP was saved
                res.json({ 
                    success: true, 
                    message: 'RSVP received successfully',
                    warning: 'Email confirmation could not be sent',
                    id: this.lastID 
                });
            }
        }
    );
});

// Send confirmation email with better error handling
async function sendConfirmationEmail(name, email, attending, adults, children) {
    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    
    const isAttending = attending === 'yes';
    const guestCount = parseInt(adults || 1) + parseInt(children || 0);

    const mailOptions = {
        from: `"Sarah & Michael" <${process.env.EMAIL_USER}>`,
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Email send failed:`, error.message);
        throw error;
    }
}

// Test email endpoint (for debugging)
app.get('/api/test-email', async (req, res) => {
    console.log('🧪 Testing email configuration...');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({
            success: false,
            error: 'Environment variables not set',
            message: 'Please set EMAIL_USER and EMAIL_PASS in your hosting environment'
        });
    }

    try {
        const testMail = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'Test Email from Wedding RSVP System',
            text: 'If you receive this, your email configuration is working correctly!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                        <h1 style="color: #4CAF50;">✅ Success!</h1>
                        <p>Your email configuration is working correctly.</p>
                        <p><strong>Configuration:</strong></p>
                        <ul>
                            <li>From: ${process.env.EMAIL_USER}</li>
                            <li>Service: Gmail</li>
                            <li>Time: ${new Date().toLocaleString()}</li>
                        </ul>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            This is a test email from your wedding RSVP system.
                        </p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(testMail);
        console.log('✅ Test email sent successfully!');
        
        res.json({ 
            success: true, 
            message: 'Test email sent! Check your inbox.',
            messageId: info.messageId,
            from: process.env.EMAIL_USER
        });
    } catch (error) {
        console.error('❌ Test email failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.toString(),
            hint: 'Make sure EMAIL_USER and EMAIL_PASS are set correctly in environment variables'
        });
    }
});

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🎉 Wedding RSVP server running on port ${PORT}`);
    console.log('='.repeat(50));
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📄 Registry: http://localhost:${PORT}/registry.html`);
    console.log(`💌 RSVP: http://localhost:${PORT}/rsvp.html`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`🧪 Test Email: http://localhost:${PORT}/api/test-email`);
    console.log('='.repeat(50));
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
