// User data storage and authentication management for Farmers and Tractor Owners (Captains)

export const DEFAULT_FARMERS = [
  {
    name: "Kondal Rao",
    mobile: "9848022334",
    village: "Hasanparthy",
    district: "Hanamkonda",
    landArea: 3,
    crops: ["Paddy", "Cotton"],
    passbookNo: "TS-WGL-98234",
    isVerified: true,
    registeredAt: "2026-01-15"
  },
  {
    name: "Venkat Swamy",
    mobile: "9989011223",
    village: "Velair",
    district: "Hanamkonda",
    landArea: 2.5,
    crops: ["Maize", "Chilli"],
    passbookNo: "TS-WGL-44102",
    isVerified: true,
    registeredAt: "2026-02-10"
  },
  {
    name: "Laxminarayana",
    mobile: "9848552134",
    village: "Pidicolla",
    district: "Jayashankar Bhupalpally",
    landArea: 4,
    crops: ["Cotton", "Maize"],
    passbookNo: "TS-JBP-77812",
    isVerified: true,
    registeredAt: "2026-03-01"
  }
];

export const DEFAULT_OWNERS = [
  {
    fullName: "Ramesh Kumar",
    mobile: "9876543210",
    dob: "1988-06-15",
    gender: "Male",
    referralCode: "AGRI2026",
    vehicleType: "Tractor",
    tractorModel: "Mahindra 575 DI XP Plus",
    vehicleNumber: "TS 04 AB 7890",
    pricing: 1200,
    village: "Hasanparthy",
    district: "Hanamkonda",
    dlNumber: "DL-0420120045612",
    rcNumber: "TS04AB7890",
    aadhaarNumber: "458912349012",
    photo: "/tractor1.jpeg",
    selfiePhoto: "/tractor1.jpeg",
    dlPhoto: "/tractor1.jpeg",
    rcFrontPhoto: "/tractor1.jpeg",
    rcBackPhoto: "/tractor1.jpeg",
    isVerified: true,
    registeredAt: "2026-01-10"
  },
  {
    fullName: "Mallesh Reddy",
    mobile: "9123456780",
    dob: "1985-03-22",
    gender: "Male",
    referralCode: "",
    vehicleType: "Tractor",
    tractorModel: "Swaraj 744 FE XT",
    vehicleNumber: "TS 03 CD 4321",
    pricing: 1250,
    village: "Velair",
    district: "Hanamkonda",
    dlNumber: "DL-0320150098765",
    rcNumber: "TS03CD4321",
    aadhaarNumber: "789012345678",
    photo: "/tractor2.jpeg",
    selfiePhoto: "/tractor2.jpeg",
    dlPhoto: "/tractor2.jpeg",
    rcFrontPhoto: "/tractor2.jpeg",
    rcBackPhoto: "/tractor2.jpeg",
    isVerified: true,
    registeredAt: "2026-01-20"
  },
  {
    fullName: "Laxminarayana",
    mobile: "9848552234",
    dob: "1982-11-14",
    gender: "Male",
    referralCode: "BHUPAL50",
    vehicleType: "Corn Seeder",
    tractorModel: "Kisan Tools Hand Push Corn Seeder",
    vehicleNumber: "TS 04 XY 9988",
    pricing: 350,
    village: "Pidicolla",
    district: "Jayashankar Bhupalpally",
    dlNumber: "DL-0420100012345",
    rcNumber: "TS04XY9988",
    aadhaarNumber: "987654321098",
    photo: "/corn_seeder.jpg",
    selfiePhoto: "/corn_seeder.jpg",
    dlPhoto: "/corn_seeder.jpg",
    rcFrontPhoto: "/corn_seeder.jpg",
    rcBackPhoto: "/corn_seeder.jpg",
    isVerified: true,
    registeredAt: "2026-02-01"
  }
];

// Helper to normalize phone numbers (digits only, last 10 digits)
export function normalizePhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// Retrieve registered farmers
export function getRegisteredFarmers() {
  try {
    const saved = localStorage.getItem("agri_registered_farmers");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading agri_registered_farmers:", e);
  }
  return DEFAULT_FARMERS;
}

// Find a farmer by phone
export function findFarmerByMobile(mobile) {
  const norm = normalizePhone(mobile);
  if (!norm) return null;
  const farmers = getRegisteredFarmers();
  return farmers.find(f => normalizePhone(f.mobile) === norm) || null;
}

// Save or update a registered farmer
export function saveRegisteredFarmer(newFarmer) {
  const farmers = getRegisteredFarmers();
  const norm = normalizePhone(newFarmer.mobile);
  const existingIdx = farmers.findIndex(f => normalizePhone(f.mobile) === norm);
  
  let updated;
  if (existingIdx >= 0) {
    updated = [...farmers];
    updated[existingIdx] = { ...updated[existingIdx], ...newFarmer };
  } else {
    updated = [newFarmer, ...farmers];
  }

  try {
    localStorage.setItem("agri_registered_farmers", JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving farmer:", e);
  }
  return updated;
}

// Retrieve registered tractor owners / captains
export function getRegisteredOwners() {
  try {
    const saved = localStorage.getItem("agri_registered_owners");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading agri_registered_owners:", e);
  }
  return DEFAULT_OWNERS;
}

// Find an owner by phone or vehicle RC
export function findOwnerByMobile(identifier) {
  if (!identifier) return null;
  const cleanId = String(identifier).trim().toUpperCase();
  const normPhone = normalizePhone(identifier);
  const owners = getRegisteredOwners();

  return owners.find(o => {
    const ownerPhone = normalizePhone(o.mobile);
    const ownerRc = String(o.rcNumber || o.vehicleNumber || "").trim().toUpperCase();
    return (normPhone && ownerPhone === normPhone) || (cleanId && ownerRc === cleanId);
  }) || null;
}

// Save or update a registered tractor owner / captain
export function saveRegisteredOwner(newOwner) {
  const owners = getRegisteredOwners();
  const normPhone = normalizePhone(newOwner.mobile);
  const cleanRc = String(newOwner.rcNumber || newOwner.vehicleNumber || "").trim().toUpperCase();

  const existingIdx = owners.findIndex(o => {
    const oPhone = normalizePhone(o.mobile);
    const oRc = String(o.rcNumber || o.vehicleNumber || "").trim().toUpperCase();
    return (normPhone && oPhone === normPhone) || (cleanRc && oRc === cleanRc);
  });

  let updated;
  if (existingIdx >= 0) {
    updated = [...owners];
    updated[existingIdx] = { ...updated[existingIdx], ...newOwner };
  } else {
    updated = [newOwner, ...owners];
  }

  try {
    localStorage.setItem("agri_registered_owners", JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving owner:", e);
  }
  return updated;
}
