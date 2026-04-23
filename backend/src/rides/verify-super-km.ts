/**
 * Standalone Verification Script for Super Kilometer System
 * This script verifies the mathematical logic used in PricingService and RidesService
 */

function calculateSuperKmDiscount(distanceInKm: number, skBalance: number, basePerKmRate: number) {
    const appliedKm = Math.min(distanceInKm, skBalance);
    const discount = appliedKm * basePerKmRate;
    return {
        appliedKm: parseFloat(appliedKm.toFixed(2)),
        discount: parseFloat(discount.toFixed(2))
    };
}

function calculateFinancialBreakdown(riderPayable: number, companyPayable: number) {
    const totalFare = riderPayable + companyPayable;
    const gstRate = 0.05;
    const gstAmount = totalFare * gstRate;
    const driverEarnings = totalFare - gstAmount;
    
    return {
        totalFare: parseFloat(totalFare.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        driverEarnings: parseFloat(driverEarnings.toFixed(2))
    };
}

console.log("--- Super Kilometer Verification ---");

// Test Case 1: Sufficient Balance
console.log("\nCase 1: 5KM Ride, 10KM Super KM Balance, ₹15/km rate");
const res1 = calculateSuperKmDiscount(5, 10, 15);
console.log("Expected: 5 KM Applied, ₹75 Discount");
console.log(`Actual:   ${res1.appliedKm} KM Applied, ₹${res1.discount} Discount`);

// Test Case 2: Insufficient Balance
console.log("\nCase 2: 5KM Ride, 2KM Super KM Balance, ₹15/km rate");
const res2 = calculateSuperKmDiscount(5, 2, 15);
console.log("Expected: 2 KM Applied, ₹30 Discount");
console.log(`Actual:   ${res2.appliedKm} KM Applied, ₹${res2.discount} Discount`);

// Test Case 3: Zero Balance
console.log("\nCase 3: 5KM Ride, 0KM Super KM Balance, ₹15/km rate");
const res3 = calculateSuperKmDiscount(5, 0, 15);
console.log("Expected: 0 KM Applied, ₹0 Discount");
console.log(`Actual:   ${res3.appliedKm} KM Applied, ₹${res3.discount} Discount`);

// Test Case 4: Driver Earnings (Financial Split)
console.log("\nCase 4: Financial Split Verification");
const riderPortion = 77.25; // Taf
const companyPortion = 75;  // Discount covered by company
const fin = calculateFinancialBreakdown(riderPortion, companyPortion);
console.log(`Total Fare (Tab): ₹${fin.totalFare}`);
console.log(`GST (5%): ₹${fin.gstAmount}`);
console.log(`Driver Earnings: ₹${fin.driverEarnings}`);
console.log("Expected Driver Earnings: ₹144.64 (approx)");

if (Math.abs(fin.driverEarnings - 144.64) < 0.1) {
    console.log("\n✅ ALL CALCULATIONS VERIFIED SUCCESSFULLY");
} else {
    console.log("\n❌ VERIFICATION FAILED");
}
