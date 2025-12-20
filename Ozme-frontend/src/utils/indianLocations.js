/**
 * Indian States and Cities Data
 * Comprehensive list of Indian states/UTs and their major cities
 */

export const indianStates = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

export const citiesByState = {
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat', 'Mayabunder', 'Hut Bay'],
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati',
    'Kakinada', 'Kadapa', 'Anantapur', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam',
    'Adoni', 'Tenali', 'Proddatur', 'Chittoor', 'Hindupur', 'Bhimavaram', 'Srikakulam', 'Gudivada'
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Along', 'Roing'
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon',
    'Karimganj', 'North Lakhimpur', 'Dhubri', 'Diphu', 'Goalpara', 'Sivasagar', 'Mangaldoi'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif', 'Purnia', 'Arrah',
    'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Saharsa', 'Sasaram', 'Hajipur', 'Dehri',
    'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj', 'Sitamarhi', 'Jamalpur'
  ],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur',
    'Ambikapur', 'Dhamtari', 'Chirmiri', 'Kawardha', 'Mahasamund', 'Kondagaon'
  ],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Delhi': [
    'New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Karol Bagh', 'Chandni Chowk', 'Saket',
    'Lajpat Nagar', 'Connaught Place', 'Janakpuri', 'Pitampura', 'Shahdara', 'Mayur Vihar'
  ],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem',
    'Canacona', 'Quepem', 'Sanguem', 'Sanquelim', 'Valpoi'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar',
    'Gandhidham', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana',
    'Bhuj', 'Porbandar', 'Palanpur', 'Vapi', 'Gondal', 'Veraval', 'Godhra', 'Patan', 'Kalol'
  ],
  'Haryana': [
    'Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal',
    'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal',
    'Rewari', 'Palwal', 'Hansi', 'Narnaul', 'Fatehabad', 'Mahendragarh'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Sundernagar',
    'Kullu', 'Manali', 'Chamba', 'Hamirpur', 'Una', 'Bilaspur', 'Parwanoo', 'Kangra'
  ],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Pulwama',
    'Kupwara', 'Poonch', 'Rajouri', 'Kulgam', 'Bandipore', 'Ganderbal', 'Reasi'
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Phusro', 'Hazaribagh',
    'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Chaibasa', 'Dumka', 'Gumla', 'Godda'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari',
    'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar', 'Hospet', 'Gadag-Betageri',
    'Hassan', 'Udupi', 'Kolar', 'Mandya', 'Chitradurga', 'Chikkamagaluru', 'Bagalkot', 'Gangavathi'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha',
    'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Wayanad', 'Idukki',
    'Ernakulam', 'Attingal', 'Perinthalmanna', 'Thalassery', 'Vadakara', 'Changanassery'
  ],
  'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott', 'Kalpeni'],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam',
    'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna',
    'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati',
    'Kolhapur', 'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar',
    'Chandrapur', 'Parbhani', 'Jalna', 'Bhusawal', 'Navi Mumbai', 'Panvel', 'Satara',
    'Beed', 'Yavatmal', 'Osmanabad', 'Wardha', 'Gondia', 'Hinganghat', 'Ichalkaranji'
  ],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Moirang'],
  'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar', 'Resubelpara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha', 'Mamit'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek'],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak',
    'Baripada', 'Jharsuguda', 'Bargarh', 'Angul', 'Dhenkanal', 'Keonjhar', 'Jajpur', 'Kendrapara'
  ],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur',
    'Batala', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala',
    'Rajpura', 'Firozpur', 'Kapurthala', 'Faridkot', 'Sangrur', 'Fazilka', 'Gurdaspur'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur',
    'Sikar', 'Pali', 'Sri Ganganagar', 'Jhunjhunu', 'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh',
    'Dhaulpur', 'Gangapur City', 'Sawai Madhopur', 'Churu', 'Nagaur', 'Baran', 'Rajsamand'
  ],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Rangpo', 'Singtam', 'Jorethang'],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur',
    'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi',
    'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarapalayam',
    'Karaikkudi', 'Neyveli', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Pollachi'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar',
    'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Jagtial', 'Mancherial',
    'Kamareddy', 'Bodhan', 'Sangareddy', 'Metpally', 'Zahirabad', 'Bellampalli'
  ],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai'],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly',
    'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi',
    'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur',
    'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli',
    'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras'
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh',
    'Kotdwar', 'Nainital', 'Almora', 'Pithoragarh', 'Tehri', 'Uttarkashi', 'Chamoli', 'Pauri'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur',
    'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj',
    'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura',
    'Chakdaha', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur', 'Cooch Behar', 'Kalyani'
  ],
};

/**
 * Get all Indian states
 * @returns {Array} Array of state objects with code and name
 */
export const getStates = () => {
  return indianStates.map(s => s.name).sort();
};

/**
 * Get cities for a given state
 * @param {string} stateName - Name of the state
 * @returns {Array} Array of city names
 */
export const getCitiesByState = (stateName) => {
  if (!stateName) return [];
  return citiesByState[stateName] || [];
};

/**
 * Get state code by name
 * @param {string} stateName - Name of the state
 * @returns {string|null} State code or null
 */
export const getStateCode = (stateName) => {
  const state = indianStates.find(s => s.name === stateName);
  return state ? state.code : null;
};

/**
 * Validate if a city belongs to a state
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {boolean}
 */
export const isCityInState = (city, state) => {
  const cities = getCitiesByState(state);
  return cities.includes(city);
};

export default {
  indianStates,
  citiesByState,
  getStates,
  getCitiesByState,
  getStateCode,
  isCityInState,
};


