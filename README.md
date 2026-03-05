# BloodConnect - Blood Donation Platform

A modern web application built with **Next.js** and **Supabase** that connects blood donors with those in need. The platform facilitates emergency blood requests, manages donation camps, and helps locate nearby blood banks.

## Features

✅ **Donor Registration & Profile Management**
- Register as a blood donor with health information
- Manage availability status and donation history
- Track donation eligibility

✅ **Blood Donor Search**
- Find available donors by blood group and location
- Distance-based filtering
- Direct contact with donors

✅ **Emergency Blood Requests**
- Post urgent blood requests
- Real-time notifications to nearby donors
- Request status tracking

✅ **Donation Camps**
- Discover upcoming blood donation camps
- Register to participate
- Camp details and organizer information

✅ **Blood Banks & Hospitals**
- Locate nearby blood banks and hospitals
- View available blood types and operating hours
- Contact information

✅ **Notification System**
- Emergency alerts
- Donation reminders
- Camp updates

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React
- **Maps**: Leaflet (optional for advanced geolocation)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available at https://supabase.com)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd abi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Copy your project credentials (URL and Anon Key)
   
   c. Create a new file `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the Database**
   
   a. Open your Supabase project dashboard
   
   b. Go to SQL Editor
   
   c. Copy the entire content from `DATABASE_SCHEMA.sql` file
   
   d. Paste it in the SQL Editor and run it to create all tables and indexes

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Homepage
│   ├── auth/
│   │   ├── login/page.tsx    # Login page
│   │   └── register/page.tsx # Registration page
│   ├── search/page.tsx       # Find donors page
│   ├── request-blood/page.tsx # Emergency blood request
│   ├── camps/page.tsx        # Donation camps
│   ├── blood-banks/page.tsx  # Blood banks directory
│   └── dashboard/page.tsx    # User dashboard
├── components/
│   └── Navigation.tsx        # Navigation component
├── lib/
│   ├── supabase.ts          # Supabase client config
│   └── database.ts          # Database utility functions
└── types/
    └── database.ts          # TypeScript type definitions
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- **profiles** - User/donor information
- **blood_requests** - Emergency blood requests
- **donation_camps** - Blood donation camp details
- **blood_banks** - Blood bank and hospital information
- **donation_history** - Track donations by users
- **notifications** - User notifications
- **messages** - Communication between users
- **reviews** - User reviews and ratings

See `DATABASE_SCHEMA.sql` for complete schema details.

## Key Pages

### Home Page (`/`)
Landing page with features overview and call-to-action buttons

### Register (`/auth/register`)
User registration with blood type and location information

### Login (`/auth/login`)
Authentication page for existing users

### Search Donors (`/search`)
Find blood donors by blood group and location

### Request Blood (`/request-blood`)
Create emergency blood requests and view active requests

### Donation Camps (`/camps`)
Browse upcoming blood donation camps and register

### Blood Banks (`/blood-banks`)
Find nearby blood banks and hospitals with availability

### Dashboard (`/dashboard`)
User profile, donation history, and quick stats

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=              # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Your Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=             # Service role key for admin operations
NEXT_PUBLIC_APP_URL=                   # Application URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=       # (Optional) For Google Maps integration
```

## API Routes

The application uses Supabase for backend services:

- User authentication
- Real-time database operations
- Row-level security policies
- File storage (for user avatars)

## Authentication Flow

1. User registers via `/auth/register`
2. Email verification (optional in development)
3. Login via `/auth/login`
4. Session persisted in local storage
5. Authenticated users can access protected pages

## Features to Implement

Future enhancements planned:

- [ ] Real-time chat between donors and requesters
- [ ] Advanced Google Maps integration
- [ ] SMS notifications
- [ ] Payment integration for camp registrations
- [ ] Donor ratings and reviews
- [ ] Appointment scheduling
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Analytics and reporting

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Linter
```bash
npm run lint
```

## Database Operations

All database operations are handled through:

1. **Supabase Client** (`lib/supabase.ts`) - Direct database access
2. **Database Utilities** (`lib/database.ts`) - Helper functions for common operations
3. **React Hooks** - State management for UI

Example usage:
```typescript
import { searchDonors } from '@/lib/database'

const donors = await searchDonors(
  'O+',           // blood group
  'New York',     // location
  40.7128,        // latitude
  -74.0060,       // longitude
  10              // radius in km
)
```

## Security

- Row-level security (RLS) policies implemented in Supabase
- Users can only view public profiles
- Users can only update their own data
- Service role key used only for admin operations on server

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Create account at [vercel.com](https://vercel.com)
3. Import the repository
4. Add environment variables in Vercel dashboard
5. Deploy automatically on every push to main branch

### Deploy to Other Platforms

The application can be deployed to any Node.js hosting:
- AWS Amplify
- Netlify
- Railway
- Render
- DigitalOcean
- Azure

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` file exists and has correct values
- Restart development server after adding environment variables

### "Relation does not exist" error
- Make sure you ran the SQL schema from `DATABASE_SCHEMA.sql`
- Check that all tables were created successfully in Supabase

### Users can't login
- Verify email exists in auth.users table
- Check password is correct
- Ensure RLS policies allow access

## Support & Contribution

For issues, feature requests, or contributions:
1. Create an issue on GitHub
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Contact

For questions or support, please reach out to the project maintainers.

---

**Note**: This is a template project. Ensure to customize it according to your specific requirements before production deployment.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
