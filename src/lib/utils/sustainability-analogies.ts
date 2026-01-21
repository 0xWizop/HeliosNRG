// ============================================
// HELIOS ENERGY - Sustainability Analogies
// Human-readable equivalents for energy/carbon metrics
// ============================================

export interface Analogy {
  value: number;
  unit: string;
  description: string;
  icon: string;
  category: 'energy' | 'carbon' | 'cost';
}

// Reference values for analogies (verified sources)
const REFERENCE_VALUES = {
  // Energy equivalents (kWh)
  smartphoneChargeKwh: 0.012, // ~12Wh per full charge
  laptopChargeKwh: 0.05, // ~50Wh per full charge
  ledBulbHourKwh: 0.01, // 10W LED bulb
  evMileKwh: 0.3, // ~0.3 kWh per mile for average EV
  homeMonthKwh: 900, // Average US home monthly
  flightLAtoNYKwh: 1400, // Per passenger

  // Carbon equivalents (kgCO2e)
  carMileKg: 0.21, // Average car per mile
  flightLAtoNYKg: 180, // Per passenger
  treeYearKg: 22, // CO2 absorbed by one tree per year
  beefMealKg: 6.6, // 1kg beef production
  streamingHourKg: 0.036, // 1 hour of streaming
  googleSearchKg: 0.0003, // Single Google search

  // Cost equivalents (USD)
  coffeeUsd: 5,
  netflixMonthUsd: 15,
  gasGallonUsd: 3.5,
};

/**
 * Generate energy analogies for a given kWh value
 */
export function getEnergyAnalogies(energyKwh: number): Analogy[] {
  const analogies: Analogy[] = [];

  // Smartphone charges
  const smartphoneCharges = Math.round(energyKwh / REFERENCE_VALUES.smartphoneChargeKwh);
  if (smartphoneCharges >= 1) {
    analogies.push({
      value: smartphoneCharges,
      unit: 'smartphone charges',
      description: `Equivalent to charging a smartphone ${smartphoneCharges.toLocaleString()} times`,
      icon: '📱',
      category: 'energy',
    });
  }

  // Laptop charges
  const laptopCharges = Math.round(energyKwh / REFERENCE_VALUES.laptopChargeKwh);
  if (laptopCharges >= 1 && laptopCharges <= 10000) {
    analogies.push({
      value: laptopCharges,
      unit: 'laptop charges',
      description: `Equivalent to ${laptopCharges.toLocaleString()} laptop full charges`,
      icon: '💻',
      category: 'energy',
    });
  }

  // LED bulb hours
  const ledHours = Math.round(energyKwh / REFERENCE_VALUES.ledBulbHourKwh);
  if (ledHours >= 10) {
    analogies.push({
      value: ledHours,
      unit: 'hours of LED light',
      description: `Could power an LED bulb for ${ledHours.toLocaleString()} hours`,
      icon: '💡',
      category: 'energy',
    });
  }

  // EV miles
  const evMiles = Math.round(energyKwh / REFERENCE_VALUES.evMileKwh);
  if (evMiles >= 1) {
    analogies.push({
      value: evMiles,
      unit: 'EV miles',
      description: `Could drive an electric vehicle ${evMiles.toLocaleString()} miles`,
      icon: '🚗',
      category: 'energy',
    });
  }

  // Home months
  if (energyKwh >= REFERENCE_VALUES.homeMonthKwh * 0.1) {
    const homeMonths = energyKwh / REFERENCE_VALUES.homeMonthKwh;
    analogies.push({
      value: Math.round(homeMonths * 10) / 10,
      unit: 'months of home energy',
      description: `Equivalent to ${(homeMonths).toFixed(1)} months of average US home electricity`,
      icon: '🏠',
      category: 'energy',
    });
  }

  return analogies.slice(0, 3); // Return top 3 most relevant
}

/**
 * Generate carbon analogies for a given kgCO2e value
 */
export function getCarbonAnalogies(carbonKg: number): Analogy[] {
  const analogies: Analogy[] = [];

  // Car miles
  const carMiles = Math.round(carbonKg / REFERENCE_VALUES.carMileKg);
  if (carMiles >= 1) {
    analogies.push({
      value: carMiles,
      unit: 'miles driven',
      description: `Equivalent to driving a car ${carMiles.toLocaleString()} miles`,
      icon: '🚗',
      category: 'carbon',
    });
  }

  // Trees needed to offset (per year)
  const treesYear = carbonKg / REFERENCE_VALUES.treeYearKg;
  if (treesYear >= 0.1) {
    analogies.push({
      value: Math.round(treesYear * 10) / 10,
      unit: 'tree-years to offset',
      description: `Would take ${treesYear.toFixed(1)} trees one year to absorb`,
      icon: '🌳',
      category: 'carbon',
    });
  }

  // Streaming hours
  const streamingHours = Math.round(carbonKg / REFERENCE_VALUES.streamingHourKg);
  if (streamingHours >= 10 && streamingHours <= 100000) {
    analogies.push({
      value: streamingHours,
      unit: 'hours of streaming',
      description: `Equivalent to ${streamingHours.toLocaleString()} hours of video streaming`,
      icon: '📺',
      category: 'carbon',
    });
  }

  // Google searches
  const searches = Math.round(carbonKg / REFERENCE_VALUES.googleSearchKg);
  if (searches >= 100) {
    analogies.push({
      value: searches,
      unit: 'Google searches',
      description: `Equivalent to ${searches.toLocaleString()} Google searches`,
      icon: '🔍',
      category: 'carbon',
    });
  }

  // Flights LA to NY
  if (carbonKg >= REFERENCE_VALUES.flightLAtoNYKg * 0.1) {
    const flights = carbonKg / REFERENCE_VALUES.flightLAtoNYKg;
    analogies.push({
      value: Math.round(flights * 100) / 100,
      unit: 'LA→NY flights',
      description: `Equivalent to ${flights.toFixed(2)} one-way flights from LA to NY`,
      icon: '✈️',
      category: 'carbon',
    });
  }

  // Beef meals
  const beefMeals = Math.round(carbonKg / REFERENCE_VALUES.beefMealKg);
  if (beefMeals >= 1 && beefMeals <= 1000) {
    analogies.push({
      value: beefMeals,
      unit: 'beef meals',
      description: `Equivalent to producing ${beefMeals} kg of beef`,
      icon: '🥩',
      category: 'carbon',
    });
  }

  return analogies.slice(0, 3);
}

/**
 * Generate cost analogies for a given USD value
 */
export function getCostAnalogies(costUsd: number): Analogy[] {
  const analogies: Analogy[] = [];

  // Coffees
  const coffees = Math.round(costUsd / REFERENCE_VALUES.coffeeUsd);
  if (coffees >= 1 && coffees <= 10000) {
    analogies.push({
      value: coffees,
      unit: 'cups of coffee',
      description: `Could buy ${coffees.toLocaleString()} cups of coffee`,
      icon: '☕',
      category: 'cost',
    });
  }

  // Netflix months
  const netflixMonths = Math.round(costUsd / REFERENCE_VALUES.netflixMonthUsd);
  if (netflixMonths >= 1) {
    analogies.push({
      value: netflixMonths,
      unit: 'months of Netflix',
      description: `Could pay for ${netflixMonths.toLocaleString()} months of Netflix`,
      icon: '🎬',
      category: 'cost',
    });
  }

  // Gas gallons
  const gasGallons = Math.round(costUsd / REFERENCE_VALUES.gasGallonUsd);
  if (gasGallons >= 1) {
    analogies.push({
      value: gasGallons,
      unit: 'gallons of gas',
      description: `Could buy ${gasGallons.toLocaleString()} gallons of gasoline`,
      icon: '⛽',
      category: 'cost',
    });
  }

  return analogies.slice(0, 2);
}

/**
 * Get the single most impactful analogy for a metric
 */
export function getBestAnalogy(
  value: number,
  type: 'energy' | 'carbon' | 'cost'
): Analogy | null {
  let analogies: Analogy[];

  switch (type) {
    case 'energy':
      analogies = getEnergyAnalogies(value);
      break;
    case 'carbon':
      analogies = getCarbonAnalogies(value);
      break;
    case 'cost':
      analogies = getCostAnalogies(value);
      break;
  }

  return analogies[0] || null;
}

/**
 * Format analogy for display
 */
export function formatAnalogy(analogy: Analogy): string {
  return `${analogy.icon} ${analogy.value.toLocaleString()} ${analogy.unit}`;
}

/**
 * Get sustainability score (0-100) based on efficiency metrics
 */
export function getSustainabilityScore(params: {
  carbonKgPerDollar: number; // Lower is better
  avgGridIntensity: number; // gCO2/kWh, lower is better
  renewablePercentage?: number; // 0-100, higher is better
}): { score: number; grade: string; description: string } {
  let score = 50; // Base score

  // Carbon efficiency (target: < 0.5 kg CO2 per dollar)
  if (params.carbonKgPerDollar < 0.1) score += 20;
  else if (params.carbonKgPerDollar < 0.3) score += 15;
  else if (params.carbonKgPerDollar < 0.5) score += 10;
  else if (params.carbonKgPerDollar < 1.0) score += 5;
  else score -= 10;

  // Grid intensity (global average is 436 gCO2/kWh)
  if (params.avgGridIntensity < 100) score += 20; // Very clean grid
  else if (params.avgGridIntensity < 200) score += 15;
  else if (params.avgGridIntensity < 300) score += 10;
  else if (params.avgGridIntensity < 436) score += 5;
  else score -= 5;

  // Renewable percentage bonus
  if (params.renewablePercentage !== undefined) {
    score += Math.round(params.renewablePercentage * 0.1);
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Grade
  let grade: string;
  let description: string;

  if (score >= 90) {
    grade = 'A+';
    description = 'Excellent sustainability practices';
  } else if (score >= 80) {
    grade = 'A';
    description = 'Strong sustainability performance';
  } else if (score >= 70) {
    grade = 'B';
    description = 'Good sustainability with room to improve';
  } else if (score >= 60) {
    grade = 'C';
    description = 'Average sustainability, consider optimizations';
  } else if (score >= 50) {
    grade = 'D';
    description = 'Below average, significant improvements needed';
  } else {
    grade = 'F';
    description = 'Poor sustainability, urgent action recommended';
  }

  return { score, grade, description };
}
