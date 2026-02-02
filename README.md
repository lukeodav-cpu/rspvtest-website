# Wedding Registry & RSVP System

A beautiful, modern wedding website with registry display and RSVP functionality, complete with database storage and email confirmations.

## Features

### 🎨 Registry Page
- Clean, elegant design with romantic aesthetic
- Display multiple registry options
- Responsive layout for all devices
- Beautiful typography and animations

### 💌 RSVP System
- Modern, interactive form interface
- Real-time validation
- Guest count tracking (adults and children)
- Dietary restrictions and song requests
- Personal messages
- Loading states and success feedback

### 🗄️ Database
- SQLite database for RSVP storage
- Automatic table creation
- Persistent data storage
- Easy to query and export

### 📧 Email Confirmations
- Automatic confirmation emails to guests
- Beautiful HTML email templates
- Different messages for attending/not attending guests
- Customizable sender information

### 📊 Admin Dashboard
- View all RSVPs in real-time
- Search and filter functionality
- Statistics overview (total responses, attending, total guests)
- Export to CSV for easy data management

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Email Settings:**
   
   Open `server.js` and update the email configuration:
   
   **For Gmail:**
   ```javascript
   const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
           user: 'your-email@gmail.com',     // Your Gmail address
           pass: 'your-app-password'          // Your Gmail app password
       }
   });
   ```
   
   **Important:** For Gmail, you need to use an "App Password" instead of your regular password:
   - Go to your Google Account settings
   - Security → 2-Step Verification (must be enabled)
   - App passwords → Generate new app password
   - Use this generated password in the code
   
   **For Other Email Providers:**
   ```javascript
   const transporter = nodemailer.createTransport({
       host: 'smtp.example.com',
       port: 587,
       secure: false,
       auth: {
           user: 'your-email@example.com',
           pass: 'your-password'
       }
   });
   ```

3. **Customize the Wedding Details:**
   
   Update the following in the HTML files:
   - Couple names (Sarah & Michael)
   - Wedding date (June 15, 2026)
   - Registry store links
   - Email addresses in `server.js`

### Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Access the pages:**
   - Registry: http://localhost:3000/registry.html
   - RSVP: http://localhost:3000/rsvp.html
   - Admin Dashboard: http://localhost:3000/admin.html

## File Structure

```
wedding-registry-rsvp/
├── server.js           # Node.js backend server
├── package.json        # Dependencies and scripts
├── registry.html       # Wedding registry page
├── rsvp.html          # RSVP form page
├── admin.html         # Admin dashboard
├── wedding_rsvp.db    # SQLite database (auto-created)
└── README.md          # This file
```

## Database Schema

The `rsvps` table contains the following fields:
- `id` - Auto-incrementing primary key
- `name` - Guest name
- `email` - Guest email
- `phone` - Guest phone (optional)
- `attending` - 'yes' or 'no'
- `adults` - Number of adults
- `children` - Number of children
- `dietary` - Dietary restrictions (optional)
- `song` - Song request (optional)
- `message` - Personal message (optional)
- `created_at` - Timestamp

## API Endpoints

### POST /api/rsvp
Submit a new RSVP
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "attending": "yes",
  "adults": 2,
  "children": 1,
  "dietary": "Vegetarian",
  "song": "Happy - Pharrell Williams",
  "message": "Can't wait to celebrate!"
}
```

### GET /api/rsvps
Get all RSVPs (for admin dashboard)

### GET /api/rsvp-stats
Get RSVP statistics
```json
{
  "total": 50,
  "attending": 42,
  "not_attending": 8,
  "total_adults": 75,
  "total_children": 12
}
```

## Customization

### Colors
The color scheme uses CSS variables defined in each HTML file:
```css
:root {
    --cream: #FAF7F2;
    --sage: #9BA888;
    --terracotta: #C89F87;
    --charcoal: #2C3333;
    --soft-white: #FFFFFF;
}
```

Change these values to match your wedding theme.

### Fonts
Current fonts:
- Display: Cormorant Garamond (serif)
- Body: Montserrat (sans-serif)

Update the Google Fonts link in the HTML files to use different fonts.

### Email Template
The email template is in the `sendConfirmationEmail()` function in `server.js`. Customize the HTML to match your style.

## Deployment

### For Production:

1. **Use a production database:**
   Consider using PostgreSQL or MySQL instead of SQLite for production

2. **Environment variables:**
   Store sensitive data (email credentials, database connection) in environment variables

3. **Use a process manager:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name wedding-rsvp
   ```

4. **Deploy to a hosting service:**
   - Heroku
   - DigitalOcean
   - AWS
   - Vercel (for static files + serverless functions)

5. **Add HTTPS:**
   Use Let's Encrypt or your hosting provider's SSL certificate

## Troubleshooting

**Email not sending:**
- Check your email credentials
- For Gmail, ensure 2-Step Verification is enabled and you're using an App Password
- Check firewall settings for SMTP port access

**Database errors:**
- Ensure write permissions in the project directory
- Check that SQLite is properly installed

**CORS errors:**
- The server includes CORS middleware, but if deploying separately, ensure proper CORS configuration

**Port already in use:**
- Change the PORT variable in `server.js` to a different port number

## License

MIT License - feel free to use this for your own wedding!

## Support

For issues or questions, please create an issue in the repository or contact the developer.

---

**Congratulations on your upcoming wedding!** 🎉
