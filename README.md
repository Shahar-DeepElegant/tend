# Tend

Tend is an open-source mobile app for people who want to stay close to friends and family without relying on memory.

Life gets noisy. You forget to call, text, and check in, even when relationships matter deeply.  
Tend treats your social circle like a garden: relationships need regular watering to stay healthy.

Instead of asking "who should I reach out to next?", Tend cycles your contacts, highlights who is overdue, and helps you take action fast.

## Problem -> Solution -> Impact

**Problem**  
Keeping relationships healthy is hard when life is busy, and most people can only track a few close connections in their head.

**Solution**  
Tend organizes your people into circles, tracks last contact, and reminds you when someone needs attention.

**Impact**  
More consistent check-ins, fewer dropped connections, and stronger long-term relationships with the people you care about.

## Features

- Garden-style contact view with Inner, Mid, and Outer circles
- Up Next feed that surfaces overdue people first
- One-tap "Water" actions to log interactions quickly
- Contact import and contact-event syncing
- Daily reminder notifications with configurable timing
- Local SQLite storage with export support

## Tech Stack

- Expo + React Native + Expo Router
- TypeScript
- Expo Notifications + Background Task + Task Manager
- Expo Contacts
- Expo SQLite

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Expo-compatible environment for iOS and/or Android

### Install

```bash
npm install
```

### Run

```bash
npm run start
```

You can also run directly on a target:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

- `npm run start` - start Expo dev server
- `npm run android` - open Android target
- `npm run ios` - open iOS target
- `npm run web` - run web target
- `npm run lint` - run lint checks

## Project Structure

- `app/` - routed screens (Garden, Up Next, Watering, Profile)
- `components/` - shared UI primitives and themed components
- `lib/db/` - SQLite models, migrations, and repository layer
- `lib/notifications/` - notification and background reminder logic
- `lib/contacts/` - contact provider and event sync logic

## Product Design

Tend uses a calm, organic "garden" design language:

- Sage/terracotta/cream palette
- Soft rounded surfaces and tactile UI
- Relationship states represented as "Needs Water" vs "Thriving"

See `spec/prd/overview.md` for the full product and UI direction.

## Local Development Notes

- The app currently uses the Expo managed workflow
- Notifications and contacts require device permissions
- Some capabilities behave differently on simulators vs physical devices

## License

This project is licensed under the MIT License. See `LICENSE`.
