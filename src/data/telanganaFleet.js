import { TELANGANA_33_DISTRICTS, calculateDistanceKm, findDistrictByName } from './telanganaDistricts';

// Owner sample names across Telangana
const TELANGANA_OWNERS = [
  { name: 'G. Srinivas Rao', phone: '+91 98480-12345' },
  { name: 'K. Mallesh Goud', phone: '+91 98492-45678' },
  { name: 'V. Lingaiah Yadav', phone: '+91 97014-78901' },
  { name: 'B. Rajendra Prasad', phone: '+91 94405-33211' },
  { name: 'T. Venkanna', phone: '+91 91778-99882' },
  { name: 'Ch. Thirupathi Reddy', phone: '+91 99890-44123' },
  { name: 'P. Devender Rao', phone: '+91 96521-88432' },
  { name: 'E. Sammaiah', phone: '+91 98481-66778' },
  { name: 'M. Bhaskar Reddy', phone: '+91 97000-11223' },
  { name: 'A. Ramulu', phone: '+91 99480-55443' },
  { name: 'S. Nageshwar Rao', phone: '+91 98482-11445' },
  { name: 'K. Chandrashekar', phone: '+91 94411-22334' },
  { name: 'R. Venu Gopal', phone: '+91 91770-33445' },
  { name: 'N. Anjaiah', phone: '+91 99891-66778' },
  { name: 'P. Prabhakar', phone: '+91 96520-77889' },
  { name: 'D. Satyanarayana', phone: '+91 98483-88990' },
];

const MACHINE_BLUEPRINTS = [
  {
    brand: 'Mahindra',
    model: 'Mahindra 575 DI XP Plus (47 HP)',
    hp: 47,
    implements: ['Ploughing', 'Rotavator', 'Cultivator'],
    rate_per_hour: 850,
    rate_per_acre: 1700,
    image_url: '/images/mahindra_575.jpg',
    rating: 4.9,
    review_count: 24,
  },
  {
    brand: 'John Deere',
    model: 'John Deere 5050 D PowerPro (50 HP)',
    hp: 50,
    implements: ['Cultivator', 'Rotavator', 'Ploughing'],
    rate_per_hour: 1100,
    rate_per_acre: 2200,
    image_url: '/images/john_deere_5310.jpg',
    rating: 4.8,
    review_count: 19,
  },
  {
    brand: 'John Deere',
    model: 'John Deere Maize / Corn Combine Harvester Machine',
    hp: 75,
    implements: ['Corn Harvester', 'Straw Baler', 'Other Agricultural Work'],
    rate_per_hour: 1450,
    rate_per_acre: 2600,
    image_url: '/images/maize_corn_harvester.jpg',
    rating: 5.0,
    review_count: 28,
  },
  {
    brand: 'Massey Ferguson',
    model: 'Multi-Row Disc Seed Sower / Drill Machine',
    hp: 45,
    implements: ['Corn Seeder', 'Cultivator', 'Rotavator'],
    rate_per_hour: 880,
    rate_per_acre: 1750,
    image_url: '/images/seed_drill_harrow.jpg',
    rating: 4.8,
    review_count: 21,
  },
  {
    brand: 'Sonalika',
    model: 'Sonalika Sikander + Straw Baler Machine',
    hp: 50,
    implements: ['Straw Baler', 'Ploughing', 'Cultivator'],
    rate_per_hour: 950,
    rate_per_acre: 1900,
    image_url: '/images/straw_baler.jpg',
    rating: 4.9,
    review_count: 17,
  },
  {
    brand: 'Swaraj',
    model: 'Swaraj 744 FE High Torque (48 HP)',
    hp: 48,
    implements: ['Trailer Services', 'Rotavator', 'Ploughing'],
    rate_per_hour: 900,
    rate_per_acre: 1800,
    image_url: '/images/swaraj_blue.jpg',
    rating: 4.7,
    review_count: 31,
  },
  {
    brand: 'Massey Ferguson',
    model: 'Massey Ferguson 8740 Dyna-VT (60 HP)',
    hp: 60,
    implements: ['Cultivator', 'Ploughing', 'Rotavator'],
    rate_per_hour: 1050,
    rate_per_acre: 2100,
    image_url: '/images/massey_ferguson.jpg',
    rating: 4.8,
    review_count: 15,
  },
  {
    brand: 'Mahindra',
    model: 'Mahindra 475 DI Bhoomiputra (44 HP)',
    hp: 44,
    implements: ['Ploughing', 'Rotavator', 'Trailer Services'],
    rate_per_hour: 820,
    rate_per_acre: 1650,
    image_url: '/images/mahindra_red.jpg',
    rating: 4.9,
    review_count: 26,
  },
];

const LANDMARKS = [
  'Rythu Vedika Kendra',
  'Near Agriculture Market Yard',
  'Primary School Canal Road',
  'Cooperative Bank Chowrasta',
  'Near Main Gram Panchayat',
  'Opposite Cold Storage Yard',
  'Cotton Ginning Mill Road',
  'Near Primary Health Centre',
  'Near Kondagattu Temple Road',
  'Medaram Jathara Road',
];

/**
 * Generates initial rich fleet across all 33 Telangana districts
 */
export function generateTelanganaFleet() {
  const tractors = [];
  let currentId = 1;

  TELANGANA_33_DISTRICTS.forEach((dist, distIdx) => {
    // Allocate 3 to 5 machinery units per district
    const count = dist.id === 'hanumakonda' || dist.id === 'warangal' ? 6 : dist.id === 'hyderabad' ? 2 : 4;

    for (let i = 0; i < count; i++) {
      const blueprint = MACHINE_BLUEPRINTS[(distIdx * 3 + i) % MACHINE_BLUEPRINTS.length];
      const owner = TELANGANA_OWNERS[(distIdx * 2 + i) % TELANGANA_OWNERS.length];
      const localities = [...dist.mandals, ...dist.villages];
      const place = localities[i % localities.length];
      const mandal = dist.mandals.includes(place) ? place : dist.mandals[i % dist.mandals.length];
      const landmark = LANDMARKS[(distIdx + i) % LANDMARKS.length];

      // Small lat/lng offset from district center (~1-8km)
      const latOffset = ((i % 3) - 1) * 0.025 + (Math.sin(distIdx + i) * 0.015);
      const lngOffset = ((i % 2) - 0.5) * 0.035 + (Math.cos(distIdx + i) * 0.02);

      const tractorLat = dist.lat + latOffset;
      const tractorLng = dist.lng + lngOffset;

      const isFirst = i === 0;

      tractors.push({
        id: currentId++,
        owner_id: 100 + currentId,
        owner_name: owner.name,
        owner_phone: owner.phone,
        brand: blueprint.brand,
        model: blueprint.model,
        hp: blueprint.hp,
        implements: blueprint.implements,
        rate_per_hour: blueprint.rate_per_hour,
        rate_per_acre: blueprint.rate_per_acre,
        base_village: place,
        mandal,
        district: dist.name_en,
        whereabouts: `Stationed at ${place} (${landmark})`,
        latitude: tractorLat,
        longitude: tractorLng,
        distance_km: isFirst ? 1.4 : Math.round((2.2 + i * 1.5) * 10) / 10,
        eta_minutes: isFirst ? 15 : Math.round(15 + i * 8),
        proximity_label: isFirst ? '⚡ Ultra Nearby (Within 2 km)' : '🚜 Available in District',
        status: i % 4 === 2 ? 'busy' : 'available',
        approval_status: 'approved',
        image_url: blueprint.image_url,
        rating: blueprint.rating,
        review_count: blueprint.review_count,
        created_at: new Date(Date.now() - (distIdx * 5 + i) * 86400000).toISOString(),
      });
    }
  });

  return tractors;
}

/**
 * Rapido-style proximity re-ranking:
 * Recalculates distance and ETA for all tractors relative to farmer's selected district and mandal/village
 */
export function recalculateNearbyTractors(
  allTractors,
  farmerDistrictName,
  farmerMandalName
) {
  const farmerDistrict = findDistrictByName(farmerDistrictName) || TELANGANA_33_DISTRICTS[0];
  const farmerLat = farmerDistrict.lat;
  const farmerLng = farmerDistrict.lng;

  const updated = allTractors.map((tractor) => {
    let distanceKm;

    const isSameDistrict = tractor.district.toLowerCase() === farmerDistrict.name_en.toLowerCase();
    const isExactMatch =
      farmerMandalName &&
      farmerMandalName !== 'All' &&
      (tractor.mandal.toLowerCase() === farmerMandalName.toLowerCase() ||
       tractor.base_village.toLowerCase() === farmerMandalName.toLowerCase() ||
       (tractor.whereabouts && tractor.whereabouts.toLowerCase().includes(farmerMandalName.toLowerCase())));

    if (isExactMatch) {
      // In same mandal or village: immediate proximity (1.0 km - 2.5 km)
      distanceKm = Math.round((1.1 + ((tractor.id * 3) % 15) / 10) * 10) / 10;
    } else if (isSameDistrict) {
      // Same district, neighboring mandal/village: (3.0 km - 8.5 km)
      distanceKm = Math.round((3.2 + ((tractor.id * 7) % 55) / 10) * 10) / 10;
    } else if (tractor.latitude && tractor.longitude) {
      // Haversine distance from farmer's district center
      distanceKm = calculateDistanceKm(farmerLat, farmerLng, tractor.latitude, tractor.longitude);
    } else {
      distanceKm = 45.0;
    }

    const etaMinutes = Math.max(12, Math.round(distanceKm * 3.5 + 8));

    let proximityLabel = '📍 Inter-District Machinery';
    if (distanceKm <= 5.0) {
      proximityLabel = '⚡ Ultra Nearby (Within 5 km) • Quick Dispatch';
    } else if (distanceKm <= 15.0) {
      proximityLabel = `🚜 Nearby in ${farmerDistrict.name_en} (< 15 km)`;
    } else if (distanceKm <= 35.0) {
      proximityLabel = '📍 Regional District Service';
    }

    return {
      ...tractor,
      distance_km: distanceKm,
      eta_minutes: etaMinutes,
      proximity_label: proximityLabel,
    };
  });

  // Rapido logic: sort closest nearest first
  return updated.sort((a, b) => a.distance_km - b.distance_km);
}
