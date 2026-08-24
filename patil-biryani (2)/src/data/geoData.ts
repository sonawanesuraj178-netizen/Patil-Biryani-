export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
  postalCodePattern?: RegExp;
  states: string[];
}

export const COUNTRIES_DATA: CountryInfo[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    postalCodeLabel: 'PIN Code',
    postalCodePlaceholder: 'e.g. 416001',
    postalCodePattern: /^[1-9][0-9]{5}$/,
    states: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      // Union Territories
      'Andaman and Nicobar Islands',
      'Chandigarh',
      'Dadra and Nagar Haveli and Daman and Diu',
      'Delhi (NCT)',
      'Jammu and Kashmir',
      'Ladakh',
      'Lakshadweep',
      'Puducherry',
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    phoneCode: '+971',
    postalCodeLabel: 'Postal / Makani Code',
    postalCodePlaceholder: 'e.g. 00000',
    states: [
      'Abu Dhabi',
      'Ajman',
      'Dubai',
      'Fujairah',
      'Ras Al Khaimah',
      'Sharjah',
      'Umm Al Quwain',
    ],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    phoneCode: '+1',
    postalCodeLabel: 'ZIP Code',
    postalCodePlaceholder: 'e.g. 90210',
    postalCodePattern: /^[0-9]{5}(?:-[0-9]{4})?$/,
    states: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'California',
      'Colorado',
      'Connecticut',
      'Delaware',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Louisiana',
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Pennsylvania',
      'Rhode Island',
      'South Carolina',
      'South Dakota',
      'Tennessee',
      'Texas',
      'Utah',
      'Vermont',
      'Virginia',
      'Washington',
      'West Virginia',
      'Wisconsin',
      'Wyoming',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    phoneCode: '+44',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: 'e.g. SW1A 1AA',
    states: [
      'England',
      'Scotland',
      'Wales',
      'Northern Ireland',
      'Greater London',
      'West Midlands',
      'Greater Manchester',
      'West Yorkshire',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    phoneCode: '+1',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. M5V 2T6',
    states: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Nova Scotia',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Northwest Territories',
      'Nunavut',
      'Yukon',
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    phoneCode: '+61',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: 'e.g. 2000',
    states: [
      'New South Wales',
      'Victoria',
      'Queensland',
      'Western Australia',
      'South Australia',
      'Tasmania',
      'Australian Capital Territory',
      'Northern Territory',
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    phoneCode: '+966',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 12211',
    states: [
      'Riyadh',
      'Makkah (Mecca)',
      'Madinah (Medina)',
      'Eastern Province',
      'Asir',
      'Tabuk',
      'Hail',
      'Northern Borders',
      'Jazan',
      'Najran',
      'Al-Bahah',
      'Al-Jawf',
      'Qassim',
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    phoneCode: '+65',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 048616',
    states: [
      'Central Region',
      'East Region',
      'North Region',
      'North-East Region',
      'West Region',
    ],
  },
  {
    code: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    phoneCode: '+974',
    postalCodeLabel: 'Zone / PIN',
    postalCodePlaceholder: 'e.g. Zone 55',
    states: [
      'Doha',
      'Al Rayyan',
      'Al Wakrah',
      'Al Khor',
      'Al Shamal',
      'Umm Salal',
      'Al Daayen',
      'Al Shahaniya',
    ],
  },
  {
    code: 'OM',
    name: 'Oman',
    flag: '🇴🇲',
    phoneCode: '+968',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 100',
    states: [
      'Muscat',
      'Dhofar',
      'Musandam',
      'Al Buraimi',
      'Ad Dakhiliyah',
      'Al Batinah North',
      'Al Batinah South',
      'Ash Sharqiyah North',
      'Ash Sharqiyah South',
      'Ad Dhahirah',
      'Al Wusta',
    ],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    phoneCode: '+965',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 13001',
    states: [
      'Al Asimah (Capital)',
      'Hawalli',
      'Farwaniya',
      'Mubarak Al-Kabeer',
      'Ahmadi',
      'Jahra',
    ],
  },
  {
    code: 'BH',
    name: 'Bahrain',
    flag: '🇧🇭',
    phoneCode: '+973',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 317',
    states: [
      'Capital Governorate',
      'Muharraq Governorate',
      'Northern Governorate',
      'Southern Governorate',
    ],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    phoneCode: '+60',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: 'e.g. 50450',
    states: [
      'Johor',
      'Kedah',
      'Kelantan',
      'Kuala Lumpur',
      'Melaka',
      'Negeri Sembilan',
      'Pahang',
      'Penang',
      'Perak',
      'Perlis',
      'Sabah',
      'Sarawak',
      'Selangor',
      'Terengganu',
    ],
  },
  {
    code: 'NP',
    name: 'Nepal',
    flag: '🇳🇵',
    phoneCode: '+977',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 44600',
    states: [
      'Bagmati Province',
      'Gandaki Province',
      'Karnali Province',
      'Koshi Province',
      'Lumbini Province',
      'Madhesh Province',
      'Sudurpashchim Province',
    ],
  },
  {
    code: 'LK',
    name: 'Sri Lanka',
    flag: '🇱🇰',
    phoneCode: '+94',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 00100',
    states: [
      'Central Province',
      'Eastern Province',
      'North Central Province',
      'Northern Province',
      'North Western Province',
      'Sabaragamuwa Province',
      'Southern Province',
      'Uva Province',
      'Western Province',
    ],
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    phoneCode: '+880',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'e.g. 1205',
    states: [
      'Barishal',
      'Chattogram',
      'Dhaka',
      'Khulna',
      'Mymensingh',
      'Rajshahi',
      'Rangpur',
      'Sylhet',
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    phoneCode: '+49',
    postalCodeLabel: 'Postleitzahl (PLZ)',
    postalCodePlaceholder: 'e.g. 10115',
    states: [
      'Baden-Württemberg',
      'Bavaria (Bayern)',
      'Berlin',
      'Brandenburg',
      'Bremen',
      'Hamburg',
      'Hesse (Hessen)',
      'Lower Saxony',
      'North Rhine-Westphalia',
      'Rhineland-Palatinate',
      'Saarland',
      'Saxony',
      'Saxony-Anhalt',
      'Schleswig-Holstein',
      'Thuringia',
    ],
  },
  {
    code: 'OTHER',
    name: 'Other Country',
    flag: '🌐',
    phoneCode: '',
    postalCodeLabel: 'Postal / ZIP Code',
    postalCodePlaceholder: 'e.g. 12345',
    states: [],
  },
];

/**
 * Find country by name or code
 */
export function findCountry(countryNameOrCode?: string): CountryInfo {
  if (!countryNameOrCode) {
    return COUNTRIES_DATA[0]; // India default
  }
  const query = countryNameOrCode.trim().toLowerCase();
  const match = COUNTRIES_DATA.find(
    (c) =>
      c.name.toLowerCase() === query ||
      c.code.toLowerCase() === query ||
      (c.name.toLowerCase().includes(query) && query.length > 2)
  );
  return match || COUNTRIES_DATA[0];
}

/**
 * Get states for a selected country name or code
 */
export function getStatesForCountry(countryNameOrCode?: string): string[] {
  const country = findCountry(countryNameOrCode);
  return country.states;
}

/**
 * Formats a clean single-line or multi-line full address string
 */
export interface FormatAddressOptions {
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}

/**
 * Complete District Dataset linked to States
 */
export const STATE_DISTRICTS_DATA: Record<string, string[]> = {
  // MAHARASHTRA (36 Districts)
  Maharashtra: [
    'Kolhapur',
    'Pune',
    'Mumbai City',
    'Mumbai Suburban',
    'Thane',
    'Palghar',
    'Sangli',
    'Satara',
    'Solapur',
    'Nashik',
    'Ahmednagar (Ahilyanagar)',
    'Chhatrapati Sambhajinagar (Aurangabad)',
    'Jalgaon',
    'Dhule',
    'Nandurbar',
    'Raigad',
    'Ratnagiri',
    'Sindhudurg',
    'Nagpur',
    'Amravati',
    'Akola',
    'Yavatmal',
    'Buldhana',
    'Washim',
    'Wardha',
    'Bhandara',
    'Gondia',
    'Chandrapur',
    'Gadchiroli',
    'Nanded',
    'Latur',
    'Dharashiv (Osmanabad)',
    'Beed',
    'Jalna',
    'Parbhani',
    'Hingoli',
  ],

  // KARNATAKA (31 Districts)
  Karnataka: [
    'Belagavi (Belgaum)',
    'Bengaluru Urban',
    'Bengaluru Rural',
    'Bagalkote',
    'Ballari (Bellary)',
    'Bidar',
    'Chamarajanagar',
    'Chikkaballapur',
    'Chikkamagaluru',
    'Chitradurga',
    'Dakshina Kannada (Mangaluru)',
    'Davanagere',
    'Dharwad (Hubballi)',
    'Gadag',
    'Hassan',
    'Haveri',
    'Kalaburagi (Gulbarga)',
    'Kodagu (Coorg)',
    'Kolar',
    'Koppal',
    'Mandya',
    'Mysuru (Mysore)',
    'Raichur',
    'Ramanagara',
    'Shivamogga (Shimoga)',
    'Tumakuru (Tumkur)',
    'Udupi',
    'Uttara Kannada (Karwar)',
    'Vijayanagara',
    'Vijayapura (Bijapur)',
    'Yadgir',
  ],

  // GOA
  Goa: ['North Goa', 'South Goa'],

  // GUJARAT (33 Districts)
  Gujarat: [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
    'Jamnagar',
    'Gandhinagar',
    'Junagadh',
    'Anand',
    'Kheda',
    'Bharuch',
    'Navsari',
    'Valsad',
    'Panchmahal',
    'Dahod',
    'Kutch',
    'Mehsana',
    'Patan',
    'Banaskantha',
    'Sabarkantha',
    'Aravalli',
    'Mahisagar',
    'Chhota Udaipur',
    'Narmada',
    'Tapi',
    'Dang',
    'Morbi',
    'Surendranagar',
    'Amreli',
    'Gir Somnath',
    'Porbandar',
    'Devbhumi Dwarka',
    'Botad',
  ],

  // DELHI (NCT)
  'Delhi (NCT)': [
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'Shahdara',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi',
  ],

  // TAMIL NADU (38 Districts)
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Erode',
    'Vellore',
    'Thoothukudi',
    'Dindigul',
    'Thanjavur',
    'Ranipet',
    'Virudhunagar',
    'Karur',
    'Nilgiris',
    'Kanchipuram',
    'Chengalpattu',
    'Tiruvallur',
    'Tiruvannamalai',
    'Viluppuram',
    'Kallakurichi',
    'Cuddalore',
    'Nagapattinam',
    'Mayiladuthurai',
    'Tiruvarur',
    'Pudukkottai',
    'Sivaganga',
    'Ramanathapuram',
    'Theni',
    'Tenkasi',
    'Kanniyakumari',
    'Namakkal',
    'Dharmapuri',
    'Krishnagiri',
    'Tirupathur',
    'Tiruppur',
    'Ariyalur',
    'Perambalur',
  ],

  // TELANGANA (33 Districts)
  Telangana: [
    'Hyderabad',
    'Medchal-Malkajgiri',
    'Ranga Reddy',
    'Warangal',
    'Hanamkonda',
    'Karimnagar',
    'Nizamabad',
    'Khammam',
    'Nalgonda',
    'Mahabubnagar',
    'Sangareddy',
    'Siddipet',
    'Suryapet',
    'Adilabad',
    'Bhadradri Kothagudem',
    'Jagtial',
    'Jangaon',
    'Jayashankar Bhupalpally',
    'Jogulamba Gadwal',
    'Kamareddy',
    'Kumuram Bheem Asifabad',
    'Mahabubabad',
    'Mancherial',
    'Medak',
    'Mulugu',
    'Nagarkurnool',
    'Narayanpet',
    'Nirmal',
    'Peddapalli',
    'Rajanna Sircilla',
    'Vikarabad',
    'Wanaparthy',
    'Yadadri Bhuvanagiri',
  ],

  // ANDHRA PRADESH (26 Districts)
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada (NTR)',
    'Guntur',
    'Nellore (SPSR)',
    'Kurnool',
    'Tirupati',
    'Kakinada',
    'Anantapur',
    'Kadapa (YSR)',
    'Chittoor',
    'East Godavari (Rajahmundry)',
    'West Godavari (Bhimavaram)',
    'Krishna (Machilipatnam)',
    'Eluru',
    'Prakasam (Ongole)',
    'Srikakulam',
    'Vizianagaram',
    'Parvathipuram Manyam',
    'Alluri Sitharama Raju',
    'Anakapalli',
    'Konaseema (Amalapuram)',
    'Palnadu (Narasaraopet)',
    'Bapatla',
    'Sri Sathya Sai (Puttaparthi)',
    'Annamayya (Rayachoti)',
    'Nandyal',
  ],

  // RAJASTHAN
  Rajasthan: [
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota',
    'Ajmer',
    'Bikaner',
    'Alwar',
    'Bhilwara',
    'Sikar',
    'Pali',
    'Bharatpur',
    'Sri Ganganagar',
    'Chittorgarh',
    'Barmer',
    'Jaisalmer',
    'Nagaur',
    'Jhunjhunu',
    'Tonk',
    'Sawai Madhopur',
    'Churu',
    'Dausa',
    'Hanumangarh',
    'Banswara',
    'Dungarpur',
    'Pratapgarh',
    'Rajsamand',
    'Jalore',
    'Sirohi',
    'Baran',
    'Bundi',
    'Jhalawar',
    'Dholpur',
    'Karauli',
  ],

  // UTTAR PRADESH
  'Uttar Pradesh': [
    'Lucknow',
    'Gautam Buddha Nagar (Noida)',
    'Ghaziabad',
    'Kanpur Nagar',
    'Varanasi',
    'Agra',
    'Prayagraj (Allahabad)',
    'Meerut',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Saharanpur',
    'Gorakhpur',
    'Ayodhya (Faizabad)',
    'Jhansi',
    'Mathura',
    'Muzaffarnagar',
    'Firozabad',
    'Bulandshahr',
    'Shahjahanpur',
    'Sitapur',
    'Hardoi',
    'Mirzapur',
    'Budaun',
    'Sambhal',
    'Amroha',
    'Hapur',
    'Baghpat',
    'Rampur',
    'Bijnor',
    'Mainpuri',
    'Etawah',
    'Kannauj',
    'Farrukhabad',
    'Barabanki',
    'Raebareli',
    'Amethi',
    'Sultanpur',
    'Pratapgarh',
    'Jaunpur',
    'Ghazipur',
    'Ballia',
    'Azamgarh',
    'Mau',
    'Deoria',
    'Kushinagar',
    'Basti',
    'Sant Kabir Nagar',
    'Siddharthnagar',
    'Gonda',
    'Bahraich',
    'Balrampur',
    'Shravasti',
    'Lakhimpur Kheri',
    'Pilibhit',
    'Sonbhadra',
    'Bhadohi',
    'Chandauli',
    'Kaushambi',
    'Fatehpur',
    'Banda',
    'Chitrakoot',
    'Hamirpur',
    'Mahoba',
    'Jalaun',
    'Lalitpur',
    'Kasganj',
    'Hathras',
    'Etah',
    'Auraiya',
    'Kanpur Dehat',
    'Unnao',
  ],

  // MADHYA PRADESH
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagar',
    'Dewas',
    'Satna',
    'Ratlam',
    'Rewa',
    'Murwara (Katni)',
    'Singrauli',
    'Burhanpur',
    'Khandwa',
    'Khargone',
    'Bhind',
    'Shivpuri',
    'Vidisha',
    'Chhindwara',
    'Guna',
    'Sehore',
    'Hoshangabad (Narmadapuram)',
    'Damoh',
    'Mandsaur',
    'Neemuch',
    'Dhar',
    'Betul',
    'Seoni',
    'Balaghat',
  ],

  // WEST BENGAL
  'West Bengal': [
    'Kolkata',
    'North 24 Parganas',
    'South 24 Parganas',
    'Howrah',
    'Hooghly',
    'Purba Medinipur',
    'Paschim Medinipur',
    'Purba Bardhaman',
    'Paschim Bardhaman',
    'Nadia',
    'Murshidabad',
    'Malda',
    'Darjeeling',
    'Jalpaiguri',
    'Kalimpong',
    'Alipurduar',
    'Cooch Behar',
    'Uttar Dinajpur',
    'Dakshin Dinajpur',
    'Birbhum',
    'Bankura',
    'Purulia',
    'Jhargram',
  ],

  // KERALA
  Kerala: [
    'Ernakulam (Kochi)',
    'Thiruvananthapuram',
    'Kozhikode (Calicut)',
    'Thrissur',
    'Kollam',
    'Palakkad',
    'Malappuram',
    'Kannur',
    'Alappuzha (Alleppey)',
    'Kottayam',
    'Kasaragod',
    'Pathanamthitta',
    'Idukki',
    'Wayanad',
  ],

  // PUNJAB
  Punjab: [
    'Ludhiana',
    'Amritsar',
    'Jalandhar',
    'Patiala',
    'Bathinda',
    'SAS Nagar (Mohali)',
    'Hoshiarpur',
    'Pathankot',
    'Moga',
    'Firozpur',
    'Gurdaspur',
    'Sangrur',
    'Kapurthala',
    'Muktsar',
    'Barnala',
    'Faridkot',
    'Fatehgarh Sahib',
    'Fazilka',
    'Mansa',
    'Rupnagar',
    'SBS Nagar (Nawanshahr)',
    'Tarn Taran',
    'Malerkotla',
  ],

  // HARYANA
  Haryana: [
    'Gurugram (Gurgaon)',
    'Faridabad',
    'Panipat',
    'Ambala',
    'Yamunanagar',
    'Rohtak',
    'Hisar',
    'Karnal',
    'Sonipat',
    'Panchkula',
    'Bhiwani',
    'Sirsa',
    'Bahadurgarh (Jhajjar)',
    'Jind',
    'Rewari',
    'Kaithal',
    'Kurukshetra',
    'Palwal',
    'Fatehabad',
    'Mahendragarh (Narnaul)',
    'Charkhi Dadri',
    'Nuh (Mewat)',
  ],

  // BIHAR
  Bihar: [
    'Patna',
    'Gaya',
    'Bhagalpur',
    'Muzaffarpur',
    'Purnia',
    'Darbhanga',
    'Bihar Sharif (Nalanda)',
    'Arrah (Bhojpur)',
    'Begusarai',
    'Katihar',
    'Munger',
    'Chhapra (Saran)',
    'Samastipur',
    'Saharsa',
    'Sasaram (Rohtas)',
    'Hajipur (Vaishali)',
    'Dehri',
    'Bettiah (West Champaran)',
    'Motihari (East Champaran)',
    'Siwan',
    'Gopalganj',
    'Madhubani',
    'Sitamarhi',
    'Buxar',
    'Jehanabad',
    'Aurangabad',
    'Nawada',
    'Jamui',
    'Kishanganj',
  ],

  // ODISHA
  Odisha: [
    'Khordha (Bhubaneswar)',
    'Cuttack',
    'Ganjam (Berhampur)',
    'Sundargarh (Rourkela)',
    'Puri',
    'Sambalpur',
    'Balasore',
    'Bhadrak',
    'Baragarh',
    'Angul',
    'Jajpur',
    'Mayurbhanj',
    'Kendrapara',
    'Jagatsinghpur',
    'Dhenkanal',
    'Bolangir',
    'Kalahandi',
    'Koraput',
    'Rayagada',
    'Jharsuguda',
  ],

  // CHHATTISGARH
  Chhattisgarh: [
    'Raipur',
    'Durg (Bhilai)',
    'Bilaspur',
    'Korba',
    'Rajnandgaon',
    'Raigarh',
    'Jagdalpur (Bastar)',
    'Ambikapur (Surguja)',
    'Dhamtari',
    'Mahasamund',
    'Kanker',
    'Kabirdham (Kawardha)',
    'Janjgir-Champa',
  ],

  // JHARKHAND
  Jharkhand: [
    'Ranchi',
    'East Singhbhum (Jamshedpur)',
    'Dhanbad',
    'Bokaro',
    'Hazaribagh',
    'Deoghar',
    'Giridih',
    'Ramgarh',
    'Palamu (Medininagar)',
    'Dumka',
    'West Singhbhum (Chaibasa)',
    'Saraikela Kharsawan',
  ],

  // ASSAM
  Assam: [
    'Kamrup Metropolitan (Guwahati)',
    'Dibrugarh',
    'Silchar (Cachar)',
    'Jorhat',
    'Nagaon',
    'Tinsukia',
    'Tezpur (Sonitpur)',
    'Bongaigaon',
    'Barpeta',
    'Dhubri',
    'Karbi Anglong',
    'Golaghat',
    'Sivasagar',
    'Kamrup Rural',
    'Hailakandi',
    'Karimganj',
  ],

  // UTTARAKHAND
  Uttarakhand: [
    'Dehradun',
    'Haridwar',
    'Udham Singh Nagar (Rudrapur/Kashipur)',
    'Nainital (Haldwani)',
    'Almora',
    'Pauri Garhwal',
    'Tehri Garhwal',
    'Pithoragarh',
    'Chamoli',
    'Uttarkashi',
    'Rudraprayag',
    'Champawat',
    'Bageshwar',
  ],

  // HIMACHAL PRADESH
  'Himachal Pradesh': [
    'Shimla',
    'Kangra (Dharamshala)',
    'Mandi',
    'Solan',
    'Sirmaur (Nahan)',
    'Una',
    'Kullu',
    'Hamirpur',
    'Bilaspur',
    'Chamba',
    'Kinnaur',
    'Lahaul and Spiti',
  ],

  // JAMMU AND KASHMIR
  'Jammu and Kashmir': [
    'Srinagar',
    'Jammu',
    'Anantnag',
    'Baramulla',
    'Budgam',
    'Pulwama',
    'Kupwara',
    'Udhampur',
    'Kathua',
    'Rajouri',
    'Poonch',
    'Samba',
    'Reasi',
    'Ganderbal',
    'Bandipora',
    'Shopian',
    'Kulgam',
    'Doda',
    'Ramban',
    'Kishtwar',
  ],

  // LADAKH
  Ladakh: ['Leh', 'Kargil'],

  // CHANDIGARH
  Chandigarh: ['Chandigarh Urban'],

  // PUDUCHERRY
  Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],

  // DADRA AND NAGAR HAVELI AND DAMAN AND DIU
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Dadra & Nagar Haveli (Silvassa)'],

  // ANDAMAN AND NICOBAR ISLANDS
  'Andaman and Nicobar Islands': ['South Andaman (Port Blair)', 'North and Middle Andaman', 'Nicobar'],

  // UAE EMIRATE DISTRICTS / ZONES
  Dubai: ['Deira', 'Bur Dubai', 'Downtown Dubai', 'Business Bay', 'Jumeirah', 'Dubai Marina', 'Al Barsha', 'Al Qusais', 'Al Nahda', 'Jebel Ali', 'Al Quoz'],
  'Abu Dhabi': ['Abu Dhabi Central', 'Al Ain', 'Al Dhafra (Western Region)', 'Khalifa City', 'Musaffah', 'Yas Island'],
  Sharjah: ['Sharjah City', 'Al Majaz', 'Al Nahda', 'Al Qasimia', 'Al Dhaid', 'Khor Fakkan', 'Kalba'],
  Ajman: ['Ajman City', 'Al Nuaimiya', 'Al Rashidiya', 'Al Jurf', 'Manama', 'Masfout'],
  'Ras Al Khaimah': ['Al Nakheel', 'Al Hamra', 'Dhaid', 'Kharan'],
  Fujairah: ['Fujairah City', 'Dibba Al-Fujairah', 'Mirbah'],
  'Umm Al Quwain': ['Umm Al Quwain City', 'Falaj Al Mualla'],

  // US KEY STATES DISTRICTS / COUNTIES
  California: ['Los Angeles County', 'San Diego County', 'Orange County', 'Santa Clara (Silicon Valley)', 'San Francisco', 'Alameda County', 'Sacramento County', 'Riverside County', 'San Bernardino County', 'Fresno County', 'Contra Costa County'],
  'New York': ['New York County (Manhattan)', 'Kings County (Brooklyn)', 'Queens County', 'Bronx County', 'Richmond County (Staten Island)', 'Nassau County', 'Suffolk County', 'Westchester County', 'Erie County (Buffalo)', 'Monroe County (Rochester)'],
  Texas: ['Harris County (Houston)', 'Dallas County', 'Tarrant County (Fort Worth)', 'Bexar County (San Antonio)', 'Travis County (Austin)', 'Collin County', 'Denton County', 'El Paso County', 'Fort Bend County', 'Hidalgo County'],
  Florida: ['Miami-Dade County', 'Broward County (Fort Lauderdale)', 'Palm Beach County', 'Hillsborough County (Tampa)', 'Orange County (Orlando)', 'Duval County (Jacksonville)', 'Pinellas County', 'Lee County', 'Polk County'],
  Illinois: ['Cook County (Chicago)', 'DuPage County', 'Lake County', 'Will County', 'Kane County'],
  Washington: ['King County (Seattle)', 'Pierce County (Tacoma)', 'Snohomish County', 'Spokane County', 'Clark County'],

  // UK KEY REGIONS
  England: ['Greater London', 'Greater Manchester', 'West Midlands (Birmingham)', 'West Yorkshire (Leeds)', 'Merseyside (Liverpool)', 'South Yorkshire (Sheffield)', 'Tyne and Wear (Newcastle)', 'Bristol', 'Berkshire', 'Surrey', 'Kent', 'Essex', 'Hampshire', 'Oxfordshire', 'Cambridgeshire'],
  Scotland: ['Glasgow City', 'City of Edinburgh', 'Aberdeen City', 'Dundee City', 'Highland', 'Fife', 'South Lanarkshire'],
  Wales: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Rhondda Cynon Taf', 'Carmarthenshire'],
  'Northern Ireland': ['Belfast', 'Derry and Strabane', 'Armagh Banbridge and Craigavon', 'Lisburn and Castlereagh', 'Newry Mourne and Down'],
};

/**
 * Get districts for a selected state or country
 */
export function getDistrictsForState(countryName?: string, stateName?: string): string[] {
  if (!stateName) return [];
  const stateQuery = stateName.trim();
  
  // Exact match
  if (STATE_DISTRICTS_DATA[stateQuery]) {
    return STATE_DISTRICTS_DATA[stateQuery];
  }

  // Case-insensitive match or partial match
  const stateKeys = Object.keys(STATE_DISTRICTS_DATA);
  const matchedKey = stateKeys.find(
    (k) =>
      k.toLowerCase() === stateQuery.toLowerCase() ||
      k.toLowerCase().includes(stateQuery.toLowerCase()) ||
      stateQuery.toLowerCase().includes(k.toLowerCase())
  );

  if (matchedKey) {
    return STATE_DISTRICTS_DATA[matchedKey];
  }

  return [];
}

/**
 * Fast Instant In-Memory PIN Code Dataset for immediate zero-latency lookup
 */
export interface PincodeLookupResult {
  pinCode: string;
  district: string;
  state: string;
  city: string;
  area?: string;
  country: string;
  source: 'cache' | 'offline_database' | 'postal_api';
}

const STATIC_PIN_DATABASE: Record<string, { district: string; state: string; city: string; area?: string }> = {
  // KOLHAPUR & Surrounding (West Maharashtra)
  '416001': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Shahupuri / Station Area' },
  '416002': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Laxmipuri / B Ward' },
  '416003': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Mangalwar Peth / Mahadwar' },
  '416004': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Rajarampuri / Sykes Extension' },
  '416005': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Udyamnagar / Shivaji Udyam Nagar' },
  '416006': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Kasaba Bawada' },
  '416007': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Tarabai Park / Nagala Park' },
  '416008': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Shivaji University / Vidyanagar' },
  '416010': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Shahu Market Yard' },
  '416011': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Gokul Shirgaon MIDC' },
  '416012': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Kadamwadi' },
  '416013': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur', area: 'Ruikar Colony / Ramanandnagar' },
  '416115': { district: 'Kolhapur', state: 'Maharashtra', city: 'Ichalkaranji', area: 'Ichalkaranji Textile City' },
  '416116': { district: 'Kolhapur', state: 'Maharashtra', city: 'Ichalkaranji', area: 'Gandhi Nagar Ichalkaranji' },
  '416119': { district: 'Kolhapur', state: 'Maharashtra', city: 'Gandhinagar', area: 'Gandhinagar Market' },
  '416202': { district: 'Kolhapur', state: 'Maharashtra', city: 'Kagal', area: 'Kagal MIDC' },
  '416209': { district: 'Kolhapur', state: 'Maharashtra', city: 'Jaysingpur', area: 'Jaysingpur Town' },
  '416214': { district: 'Kolhapur', state: 'Maharashtra', city: 'Hatkanangle', area: 'Hatkanangle' },
  '416216': { district: 'Kolhapur', state: 'Maharashtra', city: 'Panhala', area: 'Panhala Fort' },
  '416229': { district: 'Kolhapur', state: 'Maharashtra', city: 'Shirol', area: 'Shirol' },
  '416234': { district: 'Kolhapur', state: 'Maharashtra', city: 'Gadhinglaj', area: 'Gadhinglaj City' },

  // SANGLI & SATARA
  '416416': { district: 'Sangli', state: 'Maharashtra', city: 'Sangli', area: 'Sangli City' },
  '416415': { district: 'Sangli', state: 'Maharashtra', city: 'Miraj', area: 'Miraj Junction' },
  '416404': { district: 'Sangli', state: 'Maharashtra', city: 'Islampur', area: 'Urun Islampur' },
  '415001': { district: 'Satara', state: 'Maharashtra', city: 'Satara', area: 'Satara City' },
  '415002': { district: 'Satara', state: 'Maharashtra', city: 'Satara', area: 'Sadashiv Peth' },
  '415110': { district: 'Satara', state: 'Maharashtra', city: 'Karad', area: 'Karad City' },
  '412806': { district: 'Satara', state: 'Maharashtra', city: 'Mahabaleshwar', area: 'Mahabaleshwar Hill' },

  // PUNE
  '411001': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Camp / Pune Station' },
  '411002': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Bajirao Road / Shukrawar Peth' },
  '411004': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Deccan Gymkhana / FC Road' },
  '411005': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Shivajinagar' },
  '411007': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Aundh / University' },
  '411014': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Viman Nagar / Wadgaon Sheri' },
  '411018': { district: 'Pune', state: 'Maharashtra', city: 'Pimpri-Chinchwad', area: 'Pimpri' },
  '411028': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Hadapsar / Magarpatta' },
  '411038': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Kothrud' },
  '411045': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Baner / Balewadi' },
  '411057': { district: 'Pune', state: 'Maharashtra', city: 'Pune', area: 'Hinjawadi IT Park' },

  // MUMBAI & THANE
  '400001': { district: 'Mumbai City', state: 'Maharashtra', city: 'Mumbai', area: 'Fort / Nariman Point' },
  '400050': { district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', area: 'Bandra West' },
  '400053': { district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', area: 'Andheri West' },
  '400069': { district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', area: 'Andheri East' },
  '400076': { district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', area: 'Powai' },
  '400092': { district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', area: 'Borivali West' },
  '400601': { district: 'Thane', state: 'Maharashtra', city: 'Thane', area: 'Thane West' },
  '400703': { district: 'Thane', state: 'Maharashtra', city: 'Navi Mumbai', area: 'Vashi' },
  '410210': { district: 'Raigad', state: 'Maharashtra', city: 'Navi Mumbai', area: 'Kharghar' },

  // REST OF MAHARASHTRA
  '422001': { district: 'Nashik', state: 'Maharashtra', city: 'Nashik', area: 'Nashik City' },
  '431001': { district: 'Chhatrapati Sambhajinagar (Aurangabad)', state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar', area: 'Cantonment' },
  '413001': { district: 'Solapur', state: 'Maharashtra', city: 'Solapur', area: 'Solapur City' },
  '414001': { district: 'Ahmednagar (Ahilyanagar)', state: 'Maharashtra', city: 'Ahmednagar', area: 'Ahmednagar City' },
  '440001': { district: 'Nagpur', state: 'Maharashtra', city: 'Nagpur', area: 'Nagpur GPO' },
  '444001': { district: 'Akola', state: 'Maharashtra', city: 'Akola', area: 'Akola City' },
  '444601': { district: 'Amravati', state: 'Maharashtra', city: 'Amravati', area: 'Amravati City' },
  '425001': { district: 'Jalgaon', state: 'Maharashtra', city: 'Jalgaon', area: 'Jalgaon City' },
  '424001': { district: 'Dhule', state: 'Maharashtra', city: 'Dhule', area: 'Dhule City' },
  '431601': { district: 'Nanded', state: 'Maharashtra', city: 'Nanded', area: 'Nanded City' },
  '413512': { district: 'Latur', state: 'Maharashtra', city: 'Latur', area: 'Latur City' },
  '415612': { district: 'Ratnagiri', state: 'Maharashtra', city: 'Ratnagiri', area: 'Ratnagiri City' },
  '416510': { district: 'Sindhudurg', state: 'Maharashtra', city: 'Kudal', area: 'Kudal' },
  '416812': { district: 'Sindhudurg', state: 'Maharashtra', city: 'Sawantwadi', area: 'Sawantwadi' },

  // GOA & KARNATAKA
  '403001': { district: 'North Goa', state: 'Goa', city: 'Panaji', area: 'Panaji Capital' },
  '403601': { district: 'South Goa', state: 'Goa', city: 'Margao', area: 'Margao' },
  '590001': { district: 'Belagavi (Belgaum)', state: 'Karnataka', city: 'Belagavi', area: 'Belagavi Head Post' },
  '590002': { district: 'Belagavi (Belgaum)', state: 'Karnataka', city: 'Belagavi', area: 'Tilakwadi' },
  '590016': { district: 'Belagavi (Belgaum)', state: 'Karnataka', city: 'Belagavi', area: 'Udyambag' },
  '580001': { district: 'Dharwad (Hubballi)', state: 'Karnataka', city: 'Dharwad', area: 'Dharwad City' },
  '580020': { district: 'Dharwad (Hubballi)', state: 'Karnataka', city: 'Hubballi', area: 'Hubli City' },
  '560001': { district: 'Bengaluru Urban', state: 'Karnataka', city: 'Bengaluru', area: 'MG Road / Vidhana Soudha' },
  '560034': { district: 'Bengaluru Urban', state: 'Karnataka', city: 'Bengaluru', area: 'Koramangala' },
  '560038': { district: 'Bengaluru Urban', state: 'Karnataka', city: 'Bengaluru', area: 'Indiranagar' },
  '560100': { district: 'Bengaluru Urban', state: 'Karnataka', city: 'Bengaluru', area: 'Electronic City' },
  '570001': { district: 'Mysuru (Mysore)', state: 'Karnataka', city: 'Mysuru', area: 'Mysore Palace' },
  '575001': { district: 'Dakshina Kannada (Mangaluru)', state: 'Karnataka', city: 'Mangaluru', area: 'Mangalore City' },

  // NATIONAL METROS & MAJOR CITIES
  '110001': { district: 'New Delhi', state: 'Delhi (NCT)', city: 'New Delhi', area: 'Connaught Place' },
  '110017': { district: 'South Delhi', state: 'Delhi (NCT)', city: 'New Delhi', area: 'Saket' },
  '110092': { district: 'East Delhi', state: 'Delhi (NCT)', city: 'Delhi', area: 'Laxmi Nagar' },
  '122001': { district: 'Gurugram (Gurgaon)', state: 'Haryana', city: 'Gurugram', area: 'Old Gurgaon' },
  '122002': { district: 'Gurugram (Gurgaon)', state: 'Haryana', city: 'Gurugram', area: 'DLF Cyber City' },
  '201301': { district: 'Gautam Buddha Nagar (Noida)', state: 'Uttar Pradesh', city: 'Noida', area: 'Sector 1-18' },
  '500001': { district: 'Hyderabad', state: 'Telangana', city: 'Hyderabad', area: 'Abids / Koti' },
  '500081': { district: 'Ranga Reddy', state: 'Telangana', city: 'Hyderabad', area: 'HITEC City' },
  '600001': { district: 'Chennai', state: 'Tamil Nadu', city: 'Chennai', area: 'George Town' },
  '600017': { district: 'Chennai', state: 'Tamil Nadu', city: 'Chennai', area: 'T. Nagar' },
  '700001': { district: 'Kolkata', state: 'West Bengal', city: 'Kolkata', area: 'BBD Bagh' },
  '380001': { district: 'Ahmedabad', state: 'Gujarat', city: 'Ahmedabad', area: 'Lal Darwaja' },
  '395001': { district: 'Surat', state: 'Gujarat', city: 'Surat', area: 'Surat City' },
  '390001': { district: 'Vadodara', state: 'Gujarat', city: 'Vadodara', area: 'Vadodara City' },
  '302001': { district: 'Jaipur', state: 'Rajasthan', city: 'Jaipur', area: 'Pink City / GPO' },
  '462001': { district: 'Bhopal', state: 'Madhya Pradesh', city: 'Bhopal', area: 'Bhopal City' },
  '452001': { district: 'Indore', state: 'Madhya Pradesh', city: 'Indore', area: 'Indore City' },
  '226001': { district: 'Lucknow', state: 'Uttar Pradesh', city: 'Lucknow', area: 'Hazratganj' },
  '800001': { district: 'Patna', state: 'Bihar', city: 'Patna', area: 'Patna GPO' },
  '751001': { district: 'Khordha (Bhubaneswar)', state: 'Odisha', city: 'Bhubaneswar', area: 'Bhubaneswar Capital' },
  '834001': { district: 'Ranchi', state: 'Jharkhand', city: 'Ranchi', area: 'Ranchi GPO' },
  '492001': { district: 'Raipur', state: 'Chhattisgarh', city: 'Raipur', area: 'Raipur City' },
  '160017': { district: 'Chandigarh Urban', state: 'Chandigarh', city: 'Chandigarh', area: 'Sector 17' },
  '682001': { district: 'Ernakulam (Kochi)', state: 'Kerala', city: 'Kochi', area: 'Fort Kochi' },
  '695001': { district: 'Thiruvananthapuram', state: 'Kerala', city: 'Thiruvananthapuram', area: 'Secretariat' },
};

// In-memory runtime cache for API responses
const PIN_RUNTIME_CACHE = new Map<string, PincodeLookupResult>();

/**
 * Prefix-based rule fallback for unknown 6-digit Indian PIN codes
 */
function getPrefixBasedFallback(pin: string): PincodeLookupResult | null {
  const prefix2 = pin.substring(0, 2);
  const prefix3 = pin.substring(0, 3);

  // Maharashtra PIN codes (40xxxx - 44xxxx)
  if (prefix3 === '416') {
    return { pinCode: pin, district: 'Kolhapur', state: 'Maharashtra', city: 'Kolhapur Region', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '411' || prefix3 === '412') {
    return { pinCode: pin, district: 'Pune', state: 'Maharashtra', city: 'Pune', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '400') {
    return { pinCode: pin, district: 'Mumbai Suburban', state: 'Maharashtra', city: 'Mumbai', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '401') {
    return { pinCode: pin, district: 'Thane', state: 'Maharashtra', city: 'Thane', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '415') {
    return { pinCode: pin, district: 'Satara', state: 'Maharashtra', city: 'Satara', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '413') {
    return { pinCode: pin, district: 'Solapur', state: 'Maharashtra', city: 'Solapur', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '414') {
    return { pinCode: pin, district: 'Ahmednagar (Ahilyanagar)', state: 'Maharashtra', city: 'Ahmednagar', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '422') {
    return { pinCode: pin, district: 'Nashik', state: 'Maharashtra', city: 'Nashik', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '440' || prefix3 === '441') {
    return { pinCode: pin, district: 'Nagpur', state: 'Maharashtra', city: 'Nagpur', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '431') {
    return { pinCode: pin, district: 'Chhatrapati Sambhajinagar (Aurangabad)', state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '403') {
    return { pinCode: pin, district: 'North Goa', state: 'Goa', city: 'Panaji', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '590' || prefix3 === '591') {
    return { pinCode: pin, district: 'Belagavi (Belgaum)', state: 'Karnataka', city: 'Belagavi', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '580') {
    return { pinCode: pin, district: 'Dharwad (Hubballi)', state: 'Karnataka', city: 'Hubballi', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '560') {
    return { pinCode: pin, district: 'Bengaluru Urban', state: 'Karnataka', city: 'Bengaluru', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '500') {
    return { pinCode: pin, district: 'Hyderabad', state: 'Telangana', city: 'Hyderabad', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '600') {
    return { pinCode: pin, district: 'Chennai', state: 'Tamil Nadu', city: 'Chennai', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '700') {
    return { pinCode: pin, district: 'Kolkata', state: 'West Bengal', city: 'Kolkata', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '110') {
    return { pinCode: pin, district: 'New Delhi', state: 'Delhi (NCT)', city: 'New Delhi', country: 'India', source: 'offline_database' };
  }
  if (prefix3 === '380') {
    return { pinCode: pin, district: 'Ahmedabad', state: 'Gujarat', city: 'Ahmedabad', country: 'India', source: 'offline_database' };
  }

  // Broad state zones by 2-digit prefix
  if (prefix2 >= '40' && prefix2 <= '44') {
    return { pinCode: pin, district: 'Maharashtra District', state: 'Maharashtra', city: 'Maharashtra', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '56' && prefix2 <= '59') {
    return { pinCode: pin, district: 'Karnataka District', state: 'Karnataka', city: 'Karnataka', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '50' && prefix2 <= '53') {
    return { pinCode: pin, district: 'Telangana / Andhra', state: 'Telangana', city: 'Hyderabad Region', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '60' && prefix2 <= '64') {
    return { pinCode: pin, district: 'Tamil Nadu District', state: 'Tamil Nadu', city: 'Chennai Region', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '67' && prefix2 <= '69') {
    return { pinCode: pin, district: 'Kerala District', state: 'Kerala', city: 'Kerala', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '36' && prefix2 <= '39') {
    return { pinCode: pin, district: 'Gujarat District', state: 'Gujarat', city: 'Gujarat', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '30' && prefix2 <= '34') {
    return { pinCode: pin, district: 'Rajasthan District', state: 'Rajasthan', city: 'Rajasthan', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '20' && prefix2 <= '28') {
    return { pinCode: pin, district: 'Uttar Pradesh District', state: 'Uttar Pradesh', city: 'Uttar Pradesh', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '45' && prefix2 <= '48') {
    return { pinCode: pin, district: 'Madhya Pradesh District', state: 'Madhya Pradesh', city: 'Madhya Pradesh', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '70' && prefix2 <= '74') {
    return { pinCode: pin, district: 'West Bengal District', state: 'West Bengal', city: 'West Bengal', country: 'India', source: 'offline_database' };
  }
  if (prefix2 >= '80' && prefix2 <= '85') {
    return { pinCode: pin, district: 'Bihar District', state: 'Bihar', city: 'Bihar', country: 'India', source: 'offline_database' };
  }

  return null;
}

/**
 * Synchronous local PIN code lookup (Instant)
 */
export function lookupPincodeOffline(pinCode: string): PincodeLookupResult | null {
  const cleanPin = pinCode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) return null;

  if (PIN_RUNTIME_CACHE.has(cleanPin)) {
    return PIN_RUNTIME_CACHE.get(cleanPin)!;
  }

  if (STATIC_PIN_DATABASE[cleanPin]) {
    const data = STATIC_PIN_DATABASE[cleanPin];
    const res: PincodeLookupResult = {
      pinCode: cleanPin,
      district: data.district,
      state: data.state,
      city: data.city,
      area: data.area,
      country: 'India',
      source: 'offline_database',
    };
    PIN_RUNTIME_CACHE.set(cleanPin, res);
    return res;
  }

  return getPrefixBasedFallback(cleanPin);
}

/**
 * Real-Time Asynchronous PIN code lookup: Checks Cache -> Static DB -> Postal API -> Prefix Fallback
 */
export async function lookupPincodeAsync(
  pinCode: string,
  countryName: string = 'India',
  signal?: AbortSignal
): Promise<PincodeLookupResult | null> {
  const cleanPin = pinCode.trim();

  // Currently real-time postal API supports Indian 6-digit PIN codes
  if (countryName !== 'India' && findCountry(countryName).code !== 'IN') {
    return null;
  }

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  // Check cache first
  if (PIN_RUNTIME_CACHE.has(cleanPin)) {
    return PIN_RUNTIME_CACHE.get(cleanPin)!;
  }

  // Check local static DB
  const offlineMatch = STATIC_PIN_DATABASE[cleanPin];

  try {
    // Query Indian Postal PIN code API (fast timeout 3.5s)
    const timeoutSignal = AbortSignal.timeout(3500);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: combinedSignal,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const primaryPostOffice = data[0].PostOffice[0];
        const state = primaryPostOffice.State || (offlineMatch?.state ?? 'Maharashtra');
        const rawDistrict = primaryPostOffice.District || (offlineMatch?.district ?? 'Kolhapur');
        const district = normalizeDistrictName(rawDistrict, state);
        const city = primaryPostOffice.Name || offlineMatch?.city || district;
        const area = primaryPostOffice.Block || primaryPostOffice.Name;

        const result: PincodeLookupResult = {
          pinCode: cleanPin,
          district: district,
          state: state,
          city: city,
          area: area,
          country: 'India',
          source: 'postal_api',
        };

        PIN_RUNTIME_CACHE.set(cleanPin, result);
        return result;
      }
    }
  } catch {
    // Network offline or timeout - fallback smoothly to static/prefix DB
  }

  // Fallback to offline static or prefix database
  if (offlineMatch) {
    const res: PincodeLookupResult = {
      pinCode: cleanPin,
      district: offlineMatch.district,
      state: offlineMatch.state,
      city: offlineMatch.city,
      area: offlineMatch.area,
      country: 'India',
      source: 'offline_database',
    };
    PIN_RUNTIME_CACHE.set(cleanPin, res);
    return res;
  }

  return getPrefixBasedFallback(cleanPin);
}

/**
 * Normalizes district names to match the State's district list
 */
function normalizeDistrictName(rawDistrict: string, stateName: string): string {
  const availableDistricts = getDistrictsForState('India', stateName);
  if (availableDistricts.length === 0) return rawDistrict;

  const rawLower = rawDistrict.toLowerCase().replace(/district/gi, '').trim();
  const match = availableDistricts.find(
    (d) =>
      d.toLowerCase() === rawLower ||
      d.toLowerCase().includes(rawLower) ||
      rawLower.includes(d.toLowerCase())
  );

  return match || rawDistrict;
}

export function formatFullAddress(opts: FormatAddressOptions): string {
  const parts: string[] = [];

  if (opts.addressLine1?.trim()) parts.push(opts.addressLine1.trim());
  if (opts.addressLine2?.trim()) parts.push(opts.addressLine2.trim());
  if (opts.landmark?.trim()) parts.push(`Near/Opp: ${opts.landmark.trim()}`);
  else if (opts.area?.trim()) parts.push(opts.area.trim());
  
  // Include City & District
  const cityDistrictParts: string[] = [];
  if (opts.city?.trim()) cityDistrictParts.push(opts.city.trim());
  if (opts.district?.trim() && opts.district.trim() !== opts.city?.trim()) {
    cityDistrictParts.push(`Dist. ${opts.district.trim()}`);
  }

  if (cityDistrictParts.length > 0) {
    parts.push(cityDistrictParts.join(', '));
  }
  
  const stateAndPin: string[] = [];
  if (opts.state?.trim()) stateAndPin.push(opts.state.trim());
  if (opts.pinCode?.trim()) stateAndPin.push(opts.pinCode.trim());

  if (stateAndPin.length > 0) {
    parts.push(stateAndPin.join(' - '));
  }

  if (opts.country?.trim() && opts.country.trim() !== 'India') {
    parts.push(opts.country.trim());
  }

  return parts.join(', ');
}
