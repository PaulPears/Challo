import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { PeakHourSurge } from './src/rides/peak-hour-surge.entity';

async function checkSurge() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(PeakHourSurge);
  
  const surges = await repo.find();
  console.log('--- Peak Hour Surges ---');
  console.log(JSON.stringify(surges, null, 2));
  
  const now = new Date();
  const currentTimeString = now.toTimeString().substring(0, 8);
  const currentDayOfWeek = now.getDay();
  
  console.log('\nCurrent Server Time:', now.toISOString());
  console.log('Current Time String:', currentTimeString);
  console.log('Current Day of Week:', currentDayOfWeek);
  
  for (const peak of surges) {
    console.log(`\nChecking Surge: ${peak.name}`);
    console.log(`Active: ${peak.is_active}`);
    console.log(`Vehicle Types: ${peak.vehicle_types}`);
    console.log(`Start Time: ${peak.start_time} (Type: ${typeof peak.start_time})`);
    console.log(`End Time: ${peak.end_time} (Type: ${typeof peak.end_time})`);
    console.log(`Multiplier: ${peak.multiplier}`);
    console.log(`Days: ${JSON.stringify(peak.days_of_week)}`);
    
    let timeMatches = false;
    if (peak.start_time <= peak.end_time) {
      timeMatches = currentTimeString >= peak.start_time && currentTimeString <= peak.end_time;
    } else {
      timeMatches = currentTimeString >= peak.start_time || currentTimeString <= peak.end_time;
    }
    console.log(`Time Matches: ${timeMatches}`);
    
    let dayMatches = true;
    if (peak.days_of_week && peak.days_of_week.length > 0) {
      dayMatches = peak.days_of_week.includes(currentDayOfWeek);
    }
    console.log(`Day Matches: ${dayMatches}`);
  }

  await app.close();
}

checkSurge();
