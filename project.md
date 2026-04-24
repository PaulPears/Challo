# RideAndhra Project Overview

Official, tax-paying ride-hailing and booking platform designed for Andhra Pradesh.

## Project Vision
To provide a seamless, reliable, and transparent transportation ecosystem for riders and drivers, fully compliant with regional regulations and tax requirements.

## System Architecture

### 1. Booking & Matching
- **Smart Queue:** Rides are offered to the closest drivers first.
- **Vehicle Types:** Support for Auto, Bike, Cab, and Parcel delivery.
- **Dynamic Pricing:** Surge and fare adjustments based on distance, duration, and demand.

### 2. Financial Ecosystem (Wallet + Settlement)
- **Rider Wallet:** Instant payments and reward (Super Coins) tracking.
- **Driver Payouts:** Professional settlement system via Razorpay.
- **Tax Compliance:** Integrated GST calculation and automated platform fee deductions.
- **Audit Trail:** complete transaction history for tax reporting.

### 3. Trust & Safety
- **Two-way Rating System:** Both riders and drivers rate each other to ensure community quality.
- **Verification:** Drivers go through a multi-step approval process (License, Aadhaar, Vehicle RC).
- **Live Tracking:** Real-time GPS visibility for riders throughout the journey.

### 4. Incentives & Loyalty
- **Driver Milestones:** Cash bonuses for completing daily/weekly ride targets.
- **Rider Rewards:** Super Coins earned on every ride, redeemable for future trips.
- **Referral Program:** (Planned) Growth through community invitations.

### 5. Real-time Synchronization
- **Room-based Socket.IO**: Dedicated communication rooms for each ride ensure secure, targeted updates.
- **Bi-directional Auth**: Both Rider and Driver apps use JWT-authenticated sockets to maintain state across sessions.
- **Live Lifecycle Tracking**: Immediate UI synchronization for ride acceptance, driver arrival, trip start, and completion.

## Infrastructure & Deployment
- **Backend**: NestJS application deployed via AWS App Runner for automated scaling and zero-downtime deployments.
- **Database**: AWS RDS PostgreSQL instance for high-availability data storage and transaction integrity.
- **Production URL**: `https://sy5b8p7tug.us-east-1.awsapprunner.com`

## Maintenance & Operations
- **System Monitoring:** Health check endpoints and error logging.
- **Database Backups:** Regular snapshots for disaster recovery.
- **Security Updates:** Periodic updates to dependencies to mitigate vulnerabilities.
- **Compliance:** Built to adapt to changing local transportation regulations.
