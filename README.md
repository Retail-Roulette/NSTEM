# Retail Royale

A real-time multiplayer scavenger hunt game for retail stores (Walmart/Target). Players scan barcodes to find assigned products.

## Features

- **Black & white minimal design** - Clean, mobile-first UI
- **Two game modes** - Teams or Singular
- **Real-time multiplayer** - Firebase Realtime Database (or local fallback)
- **Barcode scanning** - Camera-based scanning for product verification
- **Product lists** - Walmart and Target product catalogs included

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Setup Firebase (Optional)

For real-time multiplayer across devices:

1. Create a [Firebase project](https://console.firebase.google.com)
2. Enable Realtime Database
3. Copy `.env.example` to `.env` and add your config

Without Firebase, the app uses localStorage for local testing (single device).

## Project Structure

```
src/
  screens/     # All 9 screens (Home, Join, Create, Lobby, Game, Results, etc.)
  components/  # BarcodeScanner
  lib/         # Firebase, gameState
  data/        # Product parsing from target.txt, walmart.txt
public/
  target.txt   # Target product list
  walmart.txt  # Walmart product list
```

## Mobile

Optimized for smartphones. Use HTTPS for camera access when testing on mobile (or localhost for development).
