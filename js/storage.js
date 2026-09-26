/**
 * DIGITAL LABOR CHOWK - STORAGE LAYER (js/storage.js)
 * Manages localStorage simulation of database (Users, Jobs, Applications, Session)
 * Seeds initial realistic mock data for zero-config demonstration.
 */

const DLC_STORAGE_KEYS = {
  USERS: 'dlc_users',
  JOBS: 'dlc_jobs',
  APPLICATIONS: 'dlc_applications',
  SESSION: 'dlc_current_session',
  INIT_FLAG: 'dlc_seed_initialized_v2'
};

// Available Trade Categories across India
const DLC_SKILLS = [
  { id: 'mason', name: 'Mason / राजमिस्त्री', icon: '🧱' },
  { id: 'electrician', name: 'Electrician / इलेक्ट्रीशियन', icon: '⚡' },
  { id: 'plumber', name: 'Plumber / प्लंबर', icon: '🔧' },
  { id: 'carpenter', name: 'Carpenter / बढ़ई', icon: '🪚' },
  { id: 'painter', name: 'Painter / पेंटर', icon: '🎨' },
  { id: 'welder', name: 'Welder / वेल्डर', icon: '🔥' },
  { id: 'labor', name: 'General Labor / मजदूर', icon: '👷' },
  { id: 'tile', name: 'Tile & Marble Worker / टाइल कारीगर', icon: '🏛️' },
  { id: 'driver', name: 'Driver & Loader / ड्राइवर', icon: '🚚' }
];

// Available Locations
const DLC_LOCATIONS = [
  'New Delhi / नई दिल्ली',
  'Noida / नोएडा',
  'Gurugram / गुरुग्राम',
  'Jaipur / जयपुर',
  'Lucknow / लखनऊ',
  'Mumbai / मुंबई',
  'Bengaluru / बेंगलुरु',
  'Patna / पटना',
  'Chandigarh / चंडीगढ़'
];

// Helper: Safely get array from localStorage
function getFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Helper: Safely save data to localStorage
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
    return false;
  }
}

// Storage API
const StorageDB = {
  // Users
  getUsers() {
    return getFromStorage(DLC_STORAGE_KEYS.USERS, []);
  },
  saveUsers(users) {
    return saveToStorage(DLC_STORAGE_KEYS.USERS, users);
  },
  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },
  getUserByPhone(phone) {
    return this.getUsers().find(u => u.phone === phone) || null;
  },
  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    return user;
  },

  // Jobs
  getJobs() {
    return getFromStorage(DLC_STORAGE_KEYS.JOBS, []);
  },
  saveJobs(jobs) {
    return saveToStorage(DLC_STORAGE_KEYS.JOBS, jobs);
  },
  getJobById(id) {
    return this.getJobs().find(j => j.id === id) || null;
  },
  saveJob(job) {
    const jobs = this.getJobs();
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = { ...jobs[idx], ...job };
    } else {
      jobs.unshift(job); // Add newest to beginning
    }
    this.saveJobs(jobs);
    return job;
  },
  deleteJob(id) {
    const jobs = this.getJobs().filter(j => j.id !== id);
    this.saveJobs(jobs);
    // Also remove applications associated with this job
    const apps = this.getApplications().filter(a => a.jobId !== id);
    this.saveApplications(apps);
    return true;
  },

  // Applications
  getApplications() {
    return getFromStorage(DLC_STORAGE_KEYS.APPLICATIONS, []);
  },
  saveApplications(applications) {
    return saveToStorage(DLC_STORAGE_KEYS.APPLICATIONS, applications);
  },
  addApplication(application) {
    const apps = this.getApplications();
    apps.unshift(application);
    this.saveApplications(apps);
    return application;
  },

  // Current Session
  getSession() {
    try {
      const sess = localStorage.getItem(DLC_STORAGE_KEYS.SESSION);
      return sess ? JSON.parse(sess) : null;
    } catch (e) {
      return null;
    }
  },
  setSession(sessionData) {
    try {
      localStorage.setItem(DLC_STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      return true;
    } catch (e) {
      return false;
    }
  },
  clearSession() {
    localStorage.removeItem(DLC_STORAGE_KEYS.SESSION);
  },

  // Reset to default seed data
  resetAllData() {
    localStorage.removeItem(DLC_STORAGE_KEYS.USERS);
    localStorage.removeItem(DLC_STORAGE_KEYS.JOBS);
    localStorage.removeItem(DLC_STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(DLC_STORAGE_KEYS.SESSION);
    localStorage.removeItem(DLC_STORAGE_KEYS.INIT_FLAG);
    this.seedDefaultData(true);
  },

  // Seed initial realistic data
  seedDefaultData(force = false) {
    if (!force && localStorage.getItem(DLC_STORAGE_KEYS.INIT_FLAG)) {
      return; // Already initialized
    }

    // Default Seed Users
    const defaultUsers = [
      {
        id: 'worker-101',
        role: 'worker',
        name: 'Ramesh Kumar (रमेश कुमार)',
        phone: '9876543210',
        password: 'password123',
        primarySkill: 'Mason / राजमिस्त्री',
        skills: ['Mason / राजमिस्त्री', 'Tile & Marble Worker / टाइल कारीगर'],
        location: 'New Delhi / नई दिल्ली',
        experience: '7',
        dailyWage: 850,
        bio: 'अनुभवी राजमिस्त्री। आरसीसी ढलाई, ईंट चिनाई और प्लास्टर कार्य में 7 साल का कार्य अनुभव। समय पर कार्य पूर्ण करने की गारंटी।',
        availability: 'available',
        createdAt: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'worker-102',
        role: 'worker',
        name: 'Sunita Devi (सुनीता देवी)',
        phone: '9811223344',
        password: 'password123',
        primarySkill: 'Painter / पेंटर',
        skills: ['Painter / पेंटर'],
        location: 'Noida / नोएडा',
        experience: '4',
        dailyWage: 750,
        bio: 'घर और कमर्शियल पेंटिंग, वॉल पुट्टी और प्राइमर कार्य की विशेषज्ञ।',
        availability: 'available',
        createdAt: '2026-09-05T11:30:00.000Z'
      },
      {
        id: 'emp-201',
        role: 'employer',
        name: 'Sharma Construction Co. (शर्मा कंस्ट्रक्शन)',
        company: 'Sharma Construction Co.',
        phone: '9899001122',
        password: 'password123',
        businessType: 'Construction',
        location: 'New Delhi / नई दिल्ली',
        contactPerson: 'Vikram Sharma',
        bio: 'Building premium residential & commercial projects in Delhi-NCR since 2014.',
        createdAt: '2026-08-15T09:00:00.000Z'
      },
      {
        id: 'emp-202',
        role: 'employer',
        name: 'Metro Home Renovations (मेट्रो होम रेनोवेशन)',
        company: 'Metro Home Renovations',
        phone: '9812345678',
        password: 'password123',
        businessType: 'Household',
        location: 'Gurugram / गुरुग्राम',
        contactPerson: 'Rajesh Gupta',
        bio: 'Home repairs, plumbing, painting and renovation services.',
        createdAt: '2026-08-20T14:15:00.000Z'
      }
    ];

    // Default Seed Jobs
    const defaultJobs = [
      {
        id: 'job-501',
        employerId: 'emp-201',
        employerName: 'Sharma Construction Co.',
        title: 'Brick Masonry & Plaster for 3-Floor Villa',
        category: 'Mason / राजमिस्त्री',
        description: 'Need skilled masons for 9-inch brickwork and external cement plastering. Site has water and electricity. Lunch provided.',
        location: 'New Delhi / नई दिल्ली',
        address: 'Pocket B, Okhla Phase 2, New Delhi',
        wage: 850,
        wageType: 'per day',
        workersNeeded: 4,
        duration: 'multi-day',
        contactPhone: '9899001122',
        status: 'active',
        postedAt: '2026-09-22T08:30:00.000Z'
      },
      {
        id: 'job-502',
        employerId: 'emp-202',
        employerName: 'Metro Home Renovations',
        title: 'Interior Wall Putty & Emulsion Painting',
        category: 'Painter / पेंटर',
        description: '3 BHK apartment interior repainting. 2 coats putty + 2 coats premium emulsion paint. Scaffolding provided.',
        location: 'Noida / नोएडा',
        address: 'Sector 62, Near Metro Station, Noida',
        wage: 800,
        wageType: 'per day',
        workersNeeded: 3,
        duration: 'multi-day',
        contactPhone: '9812345678',
        status: 'active',
        postedAt: '2026-09-23T11:00:00.000Z'
      },
      {
        id: 'job-503',
        employerId: 'emp-201',
        employerName: 'Sharma Construction Co.',
        title: 'Electrical Conduit Pipe & Distribution Wiring',
        category: 'Electrician / इलेक्ट्रीशियन',
        description: 'Installation of PVC conduit pipes and wire pulling for 10 office cabins. Safety gear required.',
        location: 'Gurugram / गुरुग्राम',
        address: 'DLF Cyber City, Phase 3, Gurugram',
        wage: 950,
        wageType: 'per day',
        workersNeeded: 2,
        duration: 'ongoing',
        contactPhone: '9899001122',
        status: 'active',
        postedAt: '2026-09-24T09:15:00.000Z'
      },
      {
        id: 'job-504',
        employerId: 'emp-202',
        employerName: 'Metro Home Renovations',
        title: 'Bathroom CPVC Pipeline & Sanitary Fitting',
        category: 'Plumber / प्लंबर',
        description: 'Full bathroom plumbing overhaul. Concealed CPVC pipes, diverters and wall-hung commode installation.',
        location: 'Jaipur / जयपुर',
        address: 'Vaishali Nagar, Near National Handloom, Jaipur',
        wage: 900,
        wageType: 'per day',
        workersNeeded: 2,
        duration: 'one-day',
        contactPhone: '9812345678',
        status: 'active',
        postedAt: '2026-09-24T14:40:00.000Z'
      },
      {
        id: 'job-505',
        employerId: 'emp-201',
        employerName: 'Sharma Construction Co.',
        title: 'Wooden Wardrobe & Modular Kitchen Assembly',
        category: 'Carpenter / बढ़ई',
        description: 'Plywood cutting, laminate pasting and hardware fixing for modern kitchen cabinets and 2 wardrobes.',
        location: 'Bengaluru / बेंगलुरु',
        address: 'Whitefield Main Road, Bengaluru',
        wage: 1000,
        wageType: 'per day',
        workersNeeded: 3,
        duration: 'multi-day',
        contactPhone: '9899001122',
        status: 'active',
        postedAt: '2026-09-25T07:20:00.000Z'
      },
      {
        id: 'job-506',
        employerId: 'emp-202',
        employerName: 'Metro Home Renovations',
        title: 'Structural Steel Grill & Arc Welding Work',
        category: 'Welder / वेल्डर',
        description: 'Boundary wall safety grills and main gate reinforcement welding. Welding rod & machine available at site.',
        location: 'Lucknow / लखनऊ',
        address: 'Vipul Khand, Gomti Nagar, Lucknow',
        wage: 850,
        wageType: 'per day',
        workersNeeded: 2,
        duration: 'one-day',
        contactPhone: '9812345678',
        status: 'active',
        postedAt: '2026-09-25T12:00:00.000Z'
      },
      {
        id: 'job-507',
        employerId: 'emp-201',
        employerName: 'Sharma Construction Co.',
        title: 'Material Unloading & Site Shifting Helpers',
        category: 'General Labor / मजदूर',
        description: 'Unloading cement bags and sand from trucks and shifting to upper floor. Immediate cash payment on site.',
        location: 'New Delhi / नई दिल्ली',
        address: 'Rohini Sector 16, New Delhi',
        wage: 700,
        wageType: 'per day',
        workersNeeded: 5,
        duration: 'one-day',
        contactPhone: '9899001122',
        status: 'active',
        postedAt: '2026-09-25T15:30:00.000Z'
      },
      {
        id: 'job-508',
        employerId: 'emp-201',
        employerName: 'Sharma Construction Co.',
        title: 'Vitrified Floor Tile & Marble Flooring',
        category: 'Tile & Marble Worker / टाइल कारीगर',
        description: '2x4 vitrified floor tiles laying with laser leveling and epoxy grouting for 2000 sq ft hall.',
        location: 'New Delhi / नई दिल्ली',
        address: 'South Extension Part 1, New Delhi',
        wage: 950,
        wageType: 'per day',
        workersNeeded: 3,
        duration: 'multi-day',
        contactPhone: '9899001122',
        status: 'active',
        postedAt: '2026-09-25T16:00:00.000Z'
      }
    ];

    // Default Seed Applications (for worker-101)
    const defaultApplications = [
      {
        id: 'app-901',
        jobId: 'job-501',
        workerId: 'worker-101',
        workerName: 'Ramesh Kumar',
        workerPhone: '9876543210',
        workerSkill: 'Mason / राजमिस्त्री',
        appliedAt: '2026-09-23T10:15:00.000Z',
        status: 'Shortlisted'
      },
      {
        id: 'app-902',
        jobId: 'job-508',
        workerId: 'worker-101',
        workerName: 'Ramesh Kumar',
        workerPhone: '9876543210',
        workerSkill: 'Tile & Marble Worker / टाइल कारीगर',
        appliedAt: '2026-09-25T16:30:00.000Z',
        status: 'Applied'
      }
    ];

    this.saveUsers(defaultUsers);
    this.saveJobs(defaultJobs);
    this.saveApplications(defaultApplications);
    localStorage.setItem(DLC_STORAGE_KEYS.INIT_FLAG, 'true');
    console.log('Digital Labor Chowk: Seed database initialized successfully.');
  }
};

// Auto-seed on load if not seeded
StorageDB.seedDefaultData();

if (typeof window !== 'undefined') {
  window.StorageDB = StorageDB;
}
if (typeof global !== 'undefined') {
  global.StorageDB = StorageDB;
}
