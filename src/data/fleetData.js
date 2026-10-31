import { TELANGANA_DISTRICTS } from './telanganaLocations';

// 14 Standard Diverse Agricultural Tractors + 3 Specialized Machines with 17 Distinct Photos
export const BASE_TRACTOR_MODELS = [
  {
    id: 1,
    brand: "Mahindra",
    model: "475 DI XP Plus (44 HP)",
    hp: "44 HP",
    equipment: "Ploughing, Rotavator, Cultivator",
    pricing: 1200,
    photo: "/tractor1.jpeg",
    rating: 4.9,
    jobsDone: 34,
    defaultOwner: "Ramesh Kumar",
    defaultMobile: "9876543210",
    villageType: "local",
    distanceKm: 0.8
  },
  {
    id: 2,
    brand: "Mahindra",
    model: "575 DI Sarpanch (47 HP)",
    hp: "47 HP",
    equipment: "Ploughing, Cultivator, Trailer Services",
    pricing: 1250,
    photo: "/images/mahindra_575.jpg",
    rating: 4.8,
    jobsDone: 28,
    defaultOwner: "Sailu Yadav",
    defaultMobile: "9032004060",
    villageType: "local",
    distanceKm: 1.2
  },
  {
    id: 3,
    brand: "John Deere",
    model: "5075E 4WD (75 HP Heavy)",
    hp: "75 HP",
    equipment: "Ploughing, Rotavator, Heavy Tillage, Laser Leveler",
    pricing: 1500,
    photo: "/tractor3.jpeg",
    rating: 5.0,
    jobsDone: 42,
    defaultOwner: "Rajesh Goud",
    defaultMobile: "9440123456",
    villageType: "local",
    distanceKm: 1.9
  },
  {
    id: 4,
    brand: "Swaraj",
    model: "744 FE XT (48 HP)",
    hp: "48 HP",
    equipment: "Rotavator, Cultivator, Trailer Services",
    pricing: 1100,
    photo: "/tractor4.jpeg",
    rating: 4.7,
    jobsDone: 19,
    defaultOwner: "Mallesh Reddy",
    defaultMobile: "9123456780",
    villageType: "nearby",
    distanceKm: 4.8
  },
  {
    id: 5,
    brand: "Massey Ferguson",
    model: "241 DI Maha Shakti (42 HP)",
    hp: "42 HP",
    equipment: "Ploughing, Disc Harrow, Cultivator",
    pricing: 1150,
    photo: "/tractor5.jpeg",
    rating: 4.9,
    jobsDone: 31,
    defaultOwner: "Kishan Rao",
    defaultMobile: "9849123450",
    villageType: "nearby",
    distanceKm: 6.5
  },
  {
    id: 6,
    brand: "Sonalika",
    model: "DI 745 III Sikander (50 HP)",
    hp: "50 HP",
    equipment: "Rotavator, Heavy Tillage, Cultivator",
    pricing: 1300,
    photo: "/tractor6.jpeg",
    rating: 4.8,
    jobsDone: 24,
    defaultOwner: "Srinivas Chary",
    defaultMobile: "9908123456",
    villageType: "nearby",
    distanceKm: 8.2
  },
  {
    id: 7,
    brand: "Kubota",
    model: "MU4501 4WD (Paddy Specialist)",
    hp: "45 HP",
    equipment: "Cage Wheels Puddling, Rotavator, Wet Land Ploughing",
    pricing: 1400,
    photo: "/tractor7.jpeg",
    rating: 5.0,
    jobsDone: 45,
    defaultOwner: "Thirupathi Goud",
    defaultMobile: "9701123456",
    villageType: "local",
    distanceKm: 1.5
  },
  {
    id: 8,
    brand: "Swaraj",
    model: "735 FE (40 HP Economical)",
    hp: "40 HP",
    equipment: "Ploughing, Cultivator, Trolley Hauling",
    pricing: 1050,
    photo: "/tractor8.jpg",
    rating: 4.8,
    jobsDone: 22,
    defaultOwner: "Prabhakar Reddy",
    defaultMobile: "9490123789",
    villageType: "nearby",
    distanceKm: 11.0
  },
  {
    id: 9,
    brand: "Mahindra",
    model: "Arjun 605 DI DLX (60 HP with Trailer)",
    hp: "60 HP",
    equipment: "Trailer Services, Heavy Haulage, Agricultural Logistics, Ploughing",
    pricing: 1350,
    photo: "/tractor9.jpg",
    rating: 4.9,
    jobsDone: 38,
    defaultOwner: "Devender Varma",
    defaultMobile: "9866123456",
    villageType: "local",
    distanceKm: 2.1
  },
  {
    id: 10,
    brand: "Farmtrac",
    model: "60 Powermaxx (55 HP Tillage Master)",
    hp: "55 HP",
    equipment: "Heavy Ploughing, Soil Tillage, Rotavator, Disc Harrow",
    pricing: 1300,
    photo: "/farmtrac_60.jpg",
    rating: 4.8,
    jobsDone: 29,
    defaultOwner: "Bikshapathi Nayak",
    defaultMobile: "9949123456",
    villageType: "nearby",
    distanceKm: 5.5
  },
  {
    id: 11,
    brand: "John Deere",
    model: "5310 GearPro (55 HP Heavy Duty)",
    hp: "55 HP",
    equipment: "Laser Leveling, Heavy Ploughing, Rotavator, Subsoiler",
    pricing: 1450,
    photo: "/images/john_deere_5310.jpg",
    rating: 4.9,
    jobsDone: 36,
    defaultOwner: "Anjaiah Yadav",
    defaultMobile: "9848556677",
    villageType: "nearby",
    distanceKm: 7.8
  },
  {
    id: 12,
    brand: "Sonalika",
    model: "Tiger DI 55 (55 HP Heavy Cultivator)",
    hp: "55 HP",
    equipment: "Deep Ploughing, Cultivator, Heavy Field Preparation",
    pricing: 1350,
    photo: "/sonalika_tiger_55.jpg",
    rating: 5.0,
    jobsDone: 51,
    defaultOwner: "Maheshwar Rao",
    defaultMobile: "9000123987",
    villageType: "nearby",
    distanceKm: 9.8
  },
  {
    id: 13,
    brand: "New Holland",
    model: "3630 TX Super Plus (55 HP 4WD)",
    hp: "55 HP",
    equipment: "Subsoiler, Heavy Disc Harrow, Rotavator, Trailer Services",
    pricing: 1400,
    photo: "/new_holland_3630.jpg",
    rating: 4.8,
    jobsDone: 26,
    defaultOwner: "Venkataiah Goud",
    defaultMobile: "9848112233",
    villageType: "nearby",
    distanceKm: 13.5
  },
  {
    id: 14,
    brand: "Eicher",
    model: "380 Super DI (40 HP Precision Sowing)",
    hp: "40 HP",
    equipment: "Ploughing, Trailer Services, Rotavator, Ridger",
    pricing: 1100,
    photo: "/eicher_380_clean.jpg",
    rating: 4.9,
    jobsDone: 33,
    defaultOwner: "Ravi Shankar",
    defaultMobile: "9988776655",
    villageType: "local",
    distanceKm: 1.0
  },
  {
    id: 15,
    brand: "Kartar",
    model: "4000 Maize Combine Harvester (Corn Machine)",
    hp: "101 HP Combine",
    equipment: "Corn Harvester, Combine Harvester, Corn Harvesting, Cobs Separation, Grain Threshing, Field Cleaning",
    pricing: 2400,
    photo: "/corn_harvester.jpg",
    rating: 4.9,
    jobsDone: 42,
    defaultOwner: "Bhadraiah Goud",
    defaultMobile: "9849234567",
    villageType: "specialty_hub",
    distanceKm: 3.2
  },
  {
    id: 16,
    brand: "Redlands",
    model: "Round Straw Baler JRB-312 (Tractor Driven)",
    hp: "45 HP PTO Driven",
    equipment: "Straw Baler, Round Baler, Straw Baling, Paddy & Maize Residue Bundling, Biomass Compacting",
    pricing: 1100,
    photo: "/straw_baler.jpg",
    rating: 4.8,
    jobsDone: 37,
    defaultOwner: "Srinivas Reddy",
    defaultMobile: "9948123890",
    villageType: "specialty_hub",
    distanceKm: 3.8
  },
  {
    id: 17,
    brand: "Kisan Tools",
    model: "Hand Push Corn Seeder & Precision Planter",
    hp: "Manual Precision Planter",
    equipment: "Corn Seeder, Hand Push Seeder, Seed Planter, Corn Seeding, Precision Maize Planting, Fertilizer Dispensing, Seed Sowing, Corn Machine",
    pricing: 350,
    photo: "/corn_seeder.jpg",
    rating: 4.9,
    jobsDone: 56,
    defaultOwner: "Laxminarayana",
    defaultMobile: "9848551234",
    villageType: "local",
    distanceKm: 0.5
  }
];

/**
 * Dynamically builds a realistic, localized fleet for any selected village & district in Telangana.
 * Ensures all 14 tractors + 3 machines belong to the chosen village and neighboring mandals in that district.
 */
export function buildFleetForLocation(selectedLocation, customUserTractors = []) {
  const activeVillage = selectedLocation?.village || 'Bhupalpally Rural';
  const activeDistrictName = selectedLocation?.district || 'Jayashankar Bhupalpally';

  // Find district villages from directory
  const distObj = TELANGANA_DISTRICTS.find(
    (d) => d.name.toLowerCase() === activeDistrictName.toLowerCase()
  ) || TELANGANA_DISTRICTS[0];

  const rawVillages = distObj.villages || [];
  const otherVillages = rawVillages
    .map((v) => v.name)
    .filter((name) => name.toLowerCase() !== activeVillage.toLowerCase());

  // Generate localized fleet from the base 17 models
  const localizedFleet = BASE_TRACTOR_MODELS.map((base, idx) => {
    let loc = activeVillage;
    let distance = base.distanceKm;

    if (base.villageType === 'nearby' && otherVillages.length > 0) {
      // Assign to nearby mandals/villages in the same district
      const nearbyIndex = (idx) % otherVillages.length;
      loc = otherVillages[nearbyIndex];
    } else if (base.villageType === 'specialty_hub') {
      loc = `${activeVillage} (District Agri Hub)`;
    }

    return {
      id: base.id,
      owner: base.defaultOwner,
      mobile: base.defaultMobile,
      location: loc,
      district: activeDistrictName,
      brand: base.brand,
      model: base.model,
      hp: base.hp,
      equipment: base.equipment,
      pricing: base.pricing,
      availability: "Available",
      photo: base.photo,
      rating: base.rating,
      jobsDone: base.jobsDone,
      distanceKm: distance
    };
  });

  // Append any user-registered custom tractors
  const customTractors = customUserTractors.filter((t) => t.id > 17);
  return [...localizedFleet, ...customTractors];
}
