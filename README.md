# Preserve - Food Waste Reduction App

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

 Credits

Built with ❤️ using:
- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Supabase](https://supabase.com)
- [NativeWind](https://nativewind.dev)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Lucide Icons](https://lucide.dev)

---

**Preserve v1.0.0** - Reducing food waste, one meal at a time.
