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

  // Clear data
  resetAllData() {
    localStorage.removeItem(DLC_STORAGE_KEYS.USERS);
    localStorage.removeItem(DLC_STORAGE_KEYS.JOBS);
    localStorage.removeItem(DLC_STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(DLC_STORAGE_KEYS.SESSION);
    localStorage.removeItem(DLC_STORAGE_KEYS.INIT_FLAG);
  },

  // Initialize clean storage without any mock/demo data
  seedDefaultData() {
    // Purge legacy mock data if initialized previously
    if (localStorage.getItem('dlc_seed_initialized_v2') || localStorage.getItem('dlc_seed_initialized')) {
      const users = this.getUsers();
      const hasMockUsers = users.some(u => u.id === 'worker-101' || u.id === 'emp-201');
      if (hasMockUsers) {
        this.saveUsers([]);
        this.saveJobs([]);
        this.saveApplications([]);
      }
      localStorage.removeItem('dlc_seed_initialized_v2');
      localStorage.removeItem('dlc_seed_initialized');
    }
  }
};

// Clean initial storage
StorageDB.seedDefaultData();

if (typeof window !== 'undefined') {
  window.StorageDB = StorageDB;
}
if (typeof global !== 'undefined') {
  global.StorageDB = StorageDB;
}
