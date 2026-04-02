# FE Tracker Frontend Upgrade Design

**Date:** 2026-04-02
**Status:** Approved

## Overview

Full visual overhaul of FE Tracker: new fonts, Google OAuth, landing page nav bar, favicon/social image, and refined UI across all pages.

## 1. Fonts

- **Headings:** Space Grotesk (bold, technical, distinctive)
- **Body:** IBM Plex Sans (clean, industrial readability)
- **Monospace:** IBM Plex Mono (barcodes, serial numbers, equipment IDs)
- Applied globally via `next/font/google` and CSS variables

## 2. Google OAuth

- "Continue with Google" button on login page (prominent, above email/password)
- Divider: "or sign in with email"
- Supabase Google Auth provider configuration
- User walks through Google Cloud OAuth credential setup

## 3. Landing Page

- **Nav bar:** Sticky. Logo left, "Features" anchor + "Sign In" button right. Hamburger on mobile.
- **Hero:** Bigger headline in Space Grotesk, subtle gradient/pattern background, refined CTAs
- **Features grid:** Better card spacing, hover effects, refined typography
- **Footer:** Cleaner layout with new fonts

## 4. Login Page

- Google OAuth button at top
- "or" divider
- Email/password form below
- Refined card styling with new fonts

## 5. Favicon & Social Sharing

- **Favicon:** Fire extinguisher silhouette icon, red on white, SVG
- **OG Image (1200x630):** Red background, white fire extinguisher icon, "FE Tracker" text, tagline

## 6. Dashboard Overhaul

- New fonts applied globally
- Stat cards: subtle gradients, refined shadows, better typography hierarchy
- Tables: cleaner rows, better hover states
- Sidebar: refined spacing, font hierarchy, subtle active states
- Header: cleaner layout

## 7. Mobile

- Landing nav collapses to hamburger menu
- Dashboard tables → card layouts on mobile
- Touch-friendly spacing verified
- Bottom nav refined with new font

## 8. Inspect Flow

- Larger pass/fail buttons
- Better card styling with new fonts
- QR scanner page refined
