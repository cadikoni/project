# FoodSaver - Food Waste Reduction App

A production-ready React Native mobile application built with Expo that helps users reduce food waste by tracking inventory, monitoring expiration dates, and sharing surplus food with the community.

## Features

### Core Functionality

1. **User Authentication**
   - Secure email/password authentication via Supabase
   - User registration with profile creation
   - Password reset functionality
   - Persistent sessions with automatic refresh

2. **Food Inventory Management**
   - Add, edit, and delete food items
   - Track expiration dates with visual indicators
   - Categorize items (Dairy, Produce, Meat, etc.)
   - Monitor storage locations (Fridge, Pantry, Freezer)
   - Mark items as consumed or wasted
   - Barcode scanning for quick entry (native platforms only)

3. **Smart Notifications**
   - Push notifications for items expiring soon
   - Customizable notification preferences
   - Automatic scheduling based on expiration dates

4. **Waste Tracking & Analytics**
   - Comprehensive waste tracking with reasons
   - Visual analytics dashboard
   - Monthly waste trends
   - Category-based insights
   - Estimated value calculations
   - Waste reduction tips

5. **Community Sharing**
   - Share surplus food with local community
   - Browse available items from others
   - Claim items with pickup details
   - Track shared and claimed items
   - Real-time status updates

6. **User Profile & Settings**
   - Editable user profiles
   - Location management for community features
   - Notification preferences
   - Account management

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Navigation**: Expo Router (file-based routing)
- **Offline Support**: AsyncStorage for local caching
- **Notifications**: Expo Notifications
- **Camera**: Expo Camera (for barcode scanning)
- **Date Utilities**: date-fns

## Project Structure

```
├── app/                          # App screens and navigation
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── inventory.tsx         # Food inventory management
│   │   ├── community.tsx         # Community sharing
│   │   ├── analytics.tsx         # Waste analytics
│   │   ├── profile.tsx           # User profile
│   │   └── _layout.tsx
│   ├── _layout.tsx               # Root layout with auth protection
│   └── +not-found.tsx
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   └── BarcodeScanner.tsx        # Barcode scanner component
├── store/                        # Zustand state management
│   ├── useAuthStore.ts           # Authentication state
│   ├── useFoodStore.ts           # Food inventory state
│   ├── useWasteStore.ts          # Waste tracking state
│   └── useCommunityStore.ts      # Community sharing state
├── lib/                          # Utilities and services
│   ├── supabase.ts               # Supabase client configuration
│   └── notifications.ts          # Notification utilities
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database schema types
│   └── env.d.ts                  # Environment variable types
└── hooks/                        # Custom React hooks
    └── useFrameworkReady.ts
```

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (for backend services)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

The `.env` file is already configured with Supabase credentials. If you need to use your own Supabase project:

1. Create a new project at [supabase.com](https://supabase.com)
2. Update `.env` with your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Database Setup

The database schema is already migrated. The following tables are created:

- `profiles` - User profiles
- `food_categories` - Food categories (pre-populated)
- `food_items` - User food inventory
- `waste_tracking` - Waste tracking records
- `community_shares` - Community food sharing
- `notifications` - In-app notifications

All tables have Row Level Security (RLS) enabled with appropriate policies.

### Step 4: Run the App

For web preview:
```bash
npm run dev
```

For iOS/Android:
```bash
npm run dev
# Then press 'i' for iOS or 'a' for Android
```

## Key Features Implementation

### Authentication Flow

The app uses Supabase Authentication with automatic session management:
- Users are redirected to login if not authenticated
- Sessions persist across app restarts
- Auth state is managed globally via Zustand

### Offline Support

- Food items are cached locally using AsyncStorage
- Offline item additions are queued and synced when online
- Categories are cached for offline access

### Push Notifications

Notifications are scheduled automatically when:
- A food item is about to expire (1 day before)
- A community share is claimed
- Waste reduction tips are available

### Barcode Scanner

The barcode scanner:
- Uses device camera (iOS/Android only)
- Supports multiple barcode formats (EAN, UPC, QR, etc.)
- Provides visual feedback on successful scans
- Falls back to manual entry on web

## Architecture Decisions

### State Management

**Zustand** was chosen for its simplicity and performance:
- Minimal boilerplate compared to Redux
- TypeScript support out of the box
- Easy to test and maintain
- Excellent performance with React Native

### Styling Approach

**NativeWind** (Tailwind CSS) provides:
- Consistent design system
- Fast development with utility classes
- Type-safe styling with TypeScript
- Easy responsive design
- No runtime style injection overhead

### Database & Backend

**Supabase** offers:
- Built-in authentication
- Real-time database subscriptions
- Row Level Security for data protection
- RESTful API and client library
- Serverless functions (if needed)
- File storage capabilities

### Navigation

**Expo Router** provides:
- File-based routing (similar to Next.js)
- Type-safe navigation
- Deep linking support
- Automatic screen generation
- Stack and Tab navigation patterns

## Security Considerations

1. **Row Level Security**: All database tables have RLS policies ensuring users can only access their own data
2. **Secure Authentication**: Passwords are hashed and managed by Supabase
3. **Input Validation**: All user inputs are validated before submission
4. **Safe Error Handling**: Errors don't expose sensitive information
5. **Environment Variables**: Sensitive keys are stored in environment variables

## Performance Optimizations

1. **Data Caching**: Frequently accessed data is cached locally
2. **Lazy Loading**: Components load on demand
3. **Optimistic Updates**: UI updates immediately while syncing in background
4. **Image Optimization**: Images are properly sized and compressed
5. **Haptic Feedback**: Provides tactile feedback for better UX

## Testing the App

### Test User Flows

1. **Sign Up**: Create a new account with email/password
2. **Add Items**: Add food items to inventory
3. **Track Waste**: Mark items as consumed or wasted
4. **Share Food**: Create a community share listing
5. **View Analytics**: Check waste tracking statistics
6. **Update Profile**: Edit profile information

### Known Limitations

- Barcode scanning only works on physical devices (iOS/Android)
- Push notifications require physical device or emulator setup
- Web platform has limited camera and notification support

## Troubleshooting

### Common Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Supabase connection issues:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure RLS policies are properly configured

**Navigation issues:**
- Clear Metro bundler cache: `npx expo start -c`
- Restart the development server

## Future Enhancements

Potential features for future versions:
- Recipe suggestions based on expiring items
- Integration with grocery delivery services
- Social features (followers, likes, comments)
- Meal planning integration
- Carbon footprint tracking
- Gamification (badges, achievements)
- Multi-language support
- Dark mode

## Contributing

This is a production-ready application. For contributions:
1. Follow the existing code style
2. Add TypeScript types for all new code
3. Test on both iOS and Android
4. Update documentation for new features

## License

MIT License - feel free to use this project as a template for your own apps.

## Credits

Built with ❤️ using:
- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Supabase](https://supabase.com)
- [NativeWind](https://nativewind.dev)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Lucide Icons](https://lucide.dev)

---

**FoodSaver v1.0.0** - Reducing food waste, one meal at a time.
