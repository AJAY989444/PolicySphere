const prisma = require('../config/db');
const CryptoVault = require('../utils/cryptoVault');
const eventBusService = require('./eventBus.service');

// Curated list of top Indian cashless network hospitals for seeding & search
const SEED_HOSPITALS = [
  {
    name: 'Apollo Hospital Bannerghatta',
    rohiniCode: 'ROHINI-100201',
    address: '154/11, Opposite IIMB, Bannerghatta Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560076',
    phone: '+91-80-2630-4050',
    cashlessDeskPhone: '+91-80-2630-4100',
    rating: 4.8,
    specialties: ['Cardiology', 'Oncology', 'Orthopedics', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 12.8954,
    longitude: 77.5991,
  },
  {
    name: 'Manipal Hospital HAL Airport Road',
    rohiniCode: 'ROHINI-100202',
    address: '98, HAL Old Airport Road, Kodihalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560017',
    phone: '+91-80-2502-4444',
    cashlessDeskPhone: '+91-80-2502-4499',
    rating: 4.7,
    specialties: ['Neurology', 'Cardiology', 'Pediatrics', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 12.9592,
    longitude: 77.6493,
  },
  {
    name: 'Fortis Hospital Mulund',
    rohiniCode: 'ROHINI-200101',
    address: 'Mulund Goregaon Link Road, Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400078',
    phone: '+91-22-4365-4365',
    cashlessDeskPhone: '+91-22-4365-4400',
    rating: 4.6,
    specialties: ['Cardiology', 'Organ Transplant', 'Orthopedics', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 19.1663,
    longitude: 72.9351,
  },
  {
    name: 'Kokilaben Dhirubhai Ambani Hospital',
    rohiniCode: 'ROHINI-200102',
    address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    phone: '+91-22-4269-6969',
    cashlessDeskPhone: '+91-22-4269-7000',
    rating: 4.9,
    specialties: ['Oncology', 'Robotic Surgery', 'Neurology', 'Pediatrics'],
    tiers: ['TIER_1'],
    latitude: 19.1314,
    longitude: 72.8252,
  },
  {
    name: 'Max Super Speciality Hospital Saket',
    rohiniCode: 'ROHINI-300101',
    address: '1, 2, Press Enclave Marg, Saket',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110017',
    phone: '+91-11-2651-5050',
    cashlessDeskPhone: '+91-11-2651-5100',
    rating: 4.7,
    specialties: ['Cardiology', 'Oncology', 'Orthopedics', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 28.5284,
    longitude: 77.2119,
  },
  {
    name: 'Medanta - The Medicity',
    rohiniCode: 'ROHINI-300102',
    address: 'CH Bakhtawar Singh Road, Sector 38',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    phone: '+91-124-414-1414',
    cashlessDeskPhone: '+91-124-414-1500',
    rating: 4.8,
    specialties: ['Cardiology', 'Liver Transplant', 'Neurology', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 28.4395,
    longitude: 77.0425,
  },
  {
    name: 'Yashoda Hospitals Somajiguda',
    rohiniCode: 'ROHINI-400101',
    address: 'Raj Bhavan Road, Matha Nagar, Somajiguda',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500082',
    phone: '+91-40-4567-4567',
    cashlessDeskPhone: '+91-40-4567-4600',
    rating: 4.6,
    specialties: ['Nephrology', 'Cardiology', 'Orthopedics', 'Emergency 24x7'],
    tiers: ['TIER_1', 'TIER_2'],
    latitude: 17.4249,
    longitude: 78.4578,
  },
  {
    name: 'Apollo Hospitals Greams Road',
    rohiniCode: 'ROHINI-500101',
    address: '21 Greams Lane, Off Greams Road, Thousand Lights',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    phone: '+91-44-2829-0200',
    cashlessDeskPhone: '+91-44-2829-0300',
    rating: 4.8,
    specialties: ['Cardiology', 'Cardiothoracic', 'Oncology', 'Emergency 24x7'],
    tiers: ['TIER_1'],
    latitude: 13.0569,
    longitude: 80.2525,
  },
];

class IntegrationsService {
  /**
   * Seed demo network hospitals if none exist
   */
  static async seedHospitalsIfEmpty() {
    const count = await prisma.networkHospital.count();
    if (count === 0) {
      for (const h of SEED_HOSPITALS) {
        await prisma.networkHospital.create({ data: h }).catch(() => {});
      }
    }
  }

  // ─── 1. DigiLocker Document Fetch Simulator (SRS 34) ───
  static async fetchDigiLockerDocuments(userConsentToken, docType = 'ALL') {
    const documentsCatalog = [
      {
        docType: 'DRIVING_LICENSE',
        docName: 'Driving License',
        docNumber: 'DL-1420110012345',
        issuer: 'Ministry of Road Transport and Highways (MoRTH)',
        status: 'VERIFIED_BY_ISSUER',
        issueDate: '2021-04-12',
        validTill: '2041-04-11',
        tokenUri: 'digilocker://in.gov.morth/dl/DL-1420110012345',
      },
      {
        docType: 'VEHICLE_RC',
        docName: 'Registration Certificate (Motor Car)',
        docNumber: 'KA-01-MJ-9876',
        issuer: 'State Transport Department, Karnataka',
        status: 'VERIFIED_BY_ISSUER',
        issueDate: '2022-08-19',
        validTill: '2037-08-18',
        tokenUri: 'digilocker://in.gov.transport/rc/KA-01-MJ-9876',
      },
      {
        docType: 'AADHAAR_CARD',
        docName: 'Aadhaar e-Identity Card',
        docNumber: 'XXXX-XXXX-9012',
        issuer: 'Unique Identification Authority of India (UIDAI)',
        status: 'VERIFIED_BY_ISSUER',
        issueDate: '2018-01-10',
        validTill: 'LIFELONG',
        tokenUri: 'digilocker://in.gov.uidai/aadhaar/9012',
      },
    ];

    const results = docType === 'ALL'
      ? documentsCatalog
      : documentsCatalog.filter((d) => d.docType === docType);

    return {
      success: true,
      service: 'DigiLocker Government National Gateway',
      consentVerified: true,
      totalDocuments: results.length,
      documents: results,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── 2. NSDL PAN Verification Simulator (SRS 34 & 12) ───
  static async verifyPan(panNumber, expectedName = null) {
    if (!panNumber || typeof panNumber !== 'string') {
      throw new Error('PAN number is required');
    }

    const cleanPan = panNumber.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(cleanPan)) {
      return {
        isValid: false,
        status: 'INVALID_FORMAT',
        message: 'PAN must be exactly 10 alphanumeric characters (e.g. ABCDE1234F).',
      };
    }

    // 4th character determines entity category
    const entityTypes = {
      P: 'Individual (Person)',
      C: 'Company / Corporate',
      H: 'Hindu Undivided Family (HUF)',
      F: 'Partnership Firm / LLP',
      T: 'Trust',
      A: 'Association of Persons',
    };
    const entityCode = cleanPan.charAt(3);
    const category = entityTypes[entityCode] || 'Individual';

    // Mock registered names
    const registeredName = expectedName ? expectedName.toUpperCase() : 'RAJESH SHARMA';

    // Persist verification log
    await prisma.nationalVerificationLog.create({
      data: {
        serviceType: 'PAN_NSDL',
        identifierHash: CryptoVault.generateIdentityHash(cleanPan),
        status: 'SUCCESS',
        resultData: { cleanPan: CryptoVault.maskPan(cleanPan), category, status: 'OPERATIVE_AND_VALID' },
      },
    }).catch(() => {});

    return {
      isValid: true,
      pan: CryptoVault.maskPan(cleanPan),
      panStatus: 'OPERATIVE_AND_VALID',
      registeredName,
      entityCategory: category,
      aadhaarSeedingStatus: 'LINKED_AND_VERIFIED',
      taxPayerJurisdiction: 'ITO WARD 24(1), BENGALURU',
      verifiedAt: new Date().toISOString(),
    };
  }

  // ─── 3. UIDAI Aadhaar eKYC Simulator (SRS 34 & 12) ───
  static async requestAadhaarOtp(aadhaarNumber) {
    const clean = String(aadhaarNumber).replace(/[^0-9]/g, '');
    if (clean.length !== 12) {
      throw new Error('Aadhaar number must be exactly 12 digits');
    }

    const txnId = 'ekyc_txn_' + Math.random().toString(36).substring(2, 10);
    return {
      success: true,
      txnId,
      maskedAadhaar: CryptoVault.maskAadhaar(clean),
      maskedPhone: '+91 XXXXX-XX89',
      message: 'OTP generated and dispatched to registered mobile number (Simulated OTP: 123456)',
      validitySeconds: 600,
    };
  }

  static async verifyAadhaarOtp(txnId, otp, aadhaarNumber = '987654321098') {
    if (otp !== '123456' && otp !== '999999') {
      return {
        success: false,
        status: 'OTP_MISMATCH',
        message: 'Invalid OTP. Please check the 6-digit code or enter 123456.',
      };
    }

    const clean = String(aadhaarNumber).replace(/[^0-9]/g, '');

    // Persist verification log
    await prisma.nationalVerificationLog.create({
      data: {
        serviceType: 'AADHAAR_EKYC',
        identifierHash: CryptoVault.generateIdentityHash(clean),
        status: 'SUCCESS',
        resultData: { status: 'SUCCESS_AUTHENTICATED' },
      },
    }).catch(() => {});

    return {
      success: true,
      status: 'SUCCESS_AUTHENTICATED',
      eKycProfile: {
        legalName: 'Rajesh Kumar Sharma',
        dateOfBirth: '1988-06-15',
        gender: 'MALE',
        maskedAadhaar: CryptoVault.maskAadhaar(clean),
        address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103',
        photoVerified: true,
        uidaiRef: 'UIDAI-' + Date.now(),
      },
      verifiedAt: new Date().toISOString(),
    };
  }

  // ─── 4. CKYC (Central KYC Registry) Simulator (SRS 34) ───
  static async lookupCkyc(ckycNumber) {
    const clean = String(ckycNumber).replace(/[^0-9]/g, '');
    if (clean.length !== 14) {
      throw new Error('Central KYC (CKYC) number must be 14 digits');
    }

    return {
      success: true,
      ckycNumber: clean,
      kycStatus: 'COMPLETED_AND_ACTIVE',
      kycKinLevel: 'NORMAL_KYC',
      registeredEntity: 'CERSAI (Central Registry of Securitisation Asset Reconstruction and Security Interest)',
      photoAvailable: true,
      verifiedIdentityProof: 'PAN & AADHAAR',
      registeredDate: '2020-11-20',
      complianceScore: 100,
    };
  }

  // ─── 5. Cashless Hospital Network Locator (SRS 34 & 3) ───
  static async searchHospitals(params = {}) {
    await this.seedHospitalsIfEmpty();

    const { city, pincode, specialty, search, limit = 20 } = params;

    const where = { isActive: true };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (pincode) {
      where.pincode = { startsWith: pincode };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    let hospitals = await prisma.networkHospital.findMany({
      where,
      take: parseInt(limit),
      orderBy: { rating: 'desc' },
    });

    // In-memory filter for JSON specialties if specified
    if (specialty) {
      hospitals = hospitals.filter((h) => {
        const specs = Array.isArray(h.specialties) ? h.specialties : [];
        return specs.some((s) => s.toLowerCase().includes(specialty.toLowerCase()));
      });
    }

    // Add simulated distance in km from user's current location/pincode
    return hospitals.map((h, idx) => ({
      ...h,
      distanceKm: parseFloat((1.2 + (idx * 1.8)).toFixed(1)),
      cashlessEligible: true,
      preAuthTurnaroundHours: 2,
    }));
  }

  /**
   * Check Cashless Pre-Auth eligibility at a specific hospital
   */
  static async checkCashlessPreAuthEligibility(hospitalId, policyNumber, requestedSum) {
    const hospital = await prisma.networkHospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new Error('Hospital not found in PolicySphere cashless network');
    }

    return {
      hospitalName: hospital.name,
      rohiniCode: hospital.rohiniCode,
      cashlessDeskContact: hospital.cashlessDeskPhone || hospital.phone,
      isNetworkPartner: true,
      eligibleForCashless: true,
      estimatedPreAuthHours: 2,
      requiredDocuments: [
        'Doctor Admission Note & Diagnosis',
        'Health Insurance E-Card / Policy Schedule',
        'Government Photo ID (Aadhaar / PAN / Voter ID)',
        'Investigation Reports & Initial Prescription',
      ],
      tpaHelpdeskHours: '24x7 Active TPA Cashless Desk',
    };
  }
}

module.exports = IntegrationsService;
