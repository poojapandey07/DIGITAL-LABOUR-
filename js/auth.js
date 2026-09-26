/**
 * DIGITAL LABOR CHOWK - AUTHENTICATION & SESSION MANAGER (js/auth.js)
 * Manages worker/employer signup, login, session validation, and page auth guards.
 */

const AuthManager = {
  /**
   * Get current session info
   * @returns {{ userId: string, role: 'worker'|'employer', name: string, phone: string } | null}
   */
  getSession() {
    return StorageDB.getSession();
  },

  /**
   * Get complete user profile object for current session
   */
  getCurrentUser() {
    const session = this.getSession();
    if (!session || !session.userId) return null;
    return StorageDB.getUserById(session.userId);
  },

  /**
   * Check if a user is currently logged in
   */
  isLoggedIn() {
    return !!this.getSession();
  },

  /**
   * Check if current user is a worker
   */
  isWorker() {
    const session = this.getSession();
    return !!session && session.role === 'worker';
  },

  /**
   * Check if current user is an employer
   */
  isEmployer() {
    const session = this.getSession();
    return !!session && session.role === 'employer';
  },

  /**
   * Validate Indian mobile number (10 digits starting with 6, 7, 8, or 9)
   */
  isValidPhone(phone) {
    const clean = String(phone).trim().replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(clean);
  },

  /**
   * Login user by phone, password, and expected role
   */
  login(phone, password, expectedRole) {
    const cleanPhone = String(phone).trim().replace(/\D/g, '');
    if (!cleanPhone || !password) {
      return { success: false, message: 'कृपया मोबाइल नंबर और पासवर्ड दर्ज करें (Please enter phone & password)' };
    }

    const user = StorageDB.getUserByPhone(cleanPhone);
    if (!user) {
      return { success: false, message: 'यह मोबाइल नंबर पंजीकृत नहीं है (Mobile number not registered)' };
    }

    if (user.password !== password) {
      return { success: false, message: 'गलत पासवर्ड। कृपया पुनः प्रयास करें (Incorrect password)' };
    }

    if (expectedRole && user.role !== expectedRole) {
      const roleName = expectedRole === 'worker' ? 'श्रमिक (Worker)' : 'नियोक्ता (Employer)';
      return { 
        success: false, 
        message: `यह खाता ${user.role === 'worker' ? 'श्रमिक' : 'नियोक्ता'} के रूप में पंजीकृत है। कृपया सही पोर्टल से लॉगिन करें।` 
      };
    }

    // Set active session
    const sessionData = {
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone
    };
    StorageDB.setSession(sessionData);

    return { success: true, user };
  },

  /**
   * Register a new worker
   */
  registerWorker(data) {
    const { name, phone, password, primarySkill, location, experience, dailyWage } = data;

    if (!name || name.trim().length < 2) {
      return { success: false, message: 'कृपया अपना पूरा नाम दर्ज करें (Please enter full name)' };
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '');
    if (!this.isValidPhone(cleanPhone)) {
      return { success: false, message: 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile)' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password min 4 chars)' };
    }

    if (!primarySkill) {
      return { success: false, message: 'कृपया अपना मुख्य कौशल/ट्रेड चुनें (Select primary skill/trade)' };
    }

    if (!location) {
      return { success: false, message: 'कृपया अपना शहर/स्थान चुनें (Select your city/location)' };
    }

    // Check if phone already exists
    if (StorageDB.getUserByPhone(cleanPhone)) {
      return { success: false, message: 'यह मोबाइल नंबर पहले से पंजीकृत है (Mobile number already registered)' };
    }

    const newWorker = {
      id: 'worker-' + Date.now(),
      role: 'worker',
      name: name.trim(),
      phone: cleanPhone,
      password: password,
      primarySkill: primarySkill,
      skills: [primarySkill],
      location: location,
      experience: experience || '1',
      dailyWage: dailyWage ? parseInt(dailyWage, 10) : 700,
      bio: '',
      availability: 'available',
      createdAt: new Date().toISOString()
    };

    StorageDB.saveUser(newWorker);

    // Auto-login newly registered worker
    StorageDB.setSession({
      userId: newWorker.id,
      role: 'worker',
      name: newWorker.name,
      phone: newWorker.phone
    });

    return { success: true, user: newWorker };
  },

  /**
   * Register a new employer
   */
  registerEmployer(data) {
    const { companyName, contactPerson, phone, password, businessType, location, address } = data;

    if (!companyName || companyName.trim().length < 2) {
      return { success: false, message: 'कृपया कंपनी/नियोक्ता का नाम दर्ज करें (Enter company/employer name)' };
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '');
    if (!this.isValidPhone(cleanPhone)) {
      return { success: false, message: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile)' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password min 4 chars)' };
    }

    if (!businessType) {
      return { success: false, message: 'कृपया व्यवसाय का प्रकार चुनें (Select business type)' };
    }

    if (!location) {
      return { success: false, message: 'कृपया अपना शहर/स्थान चुनें (Select city/location)' };
    }

    // Check if phone already registered
    if (StorageDB.getUserByPhone(cleanPhone)) {
      return { success: false, message: 'यह मोबाइल नंबर पहले से पंजीकृत है (Mobile number already registered)' };
    }

    const newEmployer = {
      id: 'emp-' + Date.now(),
      role: 'employer',
      name: companyName.trim(),
      company: companyName.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : companyName.trim(),
      phone: cleanPhone,
      password: password,
      businessType: businessType,
      location: location,
      address: address || '',
      bio: '',
      createdAt: new Date().toISOString()
    };

    StorageDB.saveUser(newEmployer);

    // Auto-login
    StorageDB.setSession({
      userId: newEmployer.id,
      role: 'employer',
      name: newEmployer.name,
      phone: newEmployer.phone
    });

    return { success: true, user: newEmployer };
  },

  /**
   * Logout current session
   */
  logout(redirectTarget = '../index.html') {
    StorageDB.clearSession();
    if (typeof showToast === 'function') {
      showToast('सफलतापूर्वक लॉगआउट किया गया (Logged out successfully)', 'info');
    }
    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 400);
  },

  /**
   * Route Guard: verify user is authenticated with required role
   * @param {'worker'|'employer'|'any'} requiredRole
   * @param {string} redirectUrl - where to redirect if unauthorized
   */
  requireAuth(requiredRole = 'any', redirectUrl = '') {
    const session = this.getSession();

    if (!session) {
      const defaultLogin = requiredRole === 'employer' ? 'employer-login.html' : 'worker-login.html';
      const target = redirectUrl || defaultLogin;
      // Preserve intended return URL
      sessionStorage.setItem('dlc_auth_redirect', window.location.href);
      window.location.href = target;
      return false;
    }

    if (requiredRole !== 'any' && session.role !== requiredRole) {
      const correctLogin = requiredRole === 'employer' ? 'employer-login.html' : 'worker-login.html';
      window.location.href = redirectUrl || correctLogin;
      return false;
    }

    return true;
  },

  /**
   * One-click demo worker login
   */
  demoWorkerLogin() {
    const worker = StorageDB.getUserById('worker-101');
    if (worker) {
      StorageDB.setSession({
        userId: worker.id,
        role: 'worker',
        name: worker.name,
        phone: worker.phone
      });
      return worker;
    }
    return null;
  },

  /**
   * One-click demo employer login
   */
  demoEmployerLogin() {
    const employer = StorageDB.getUserById('emp-201');
    if (employer) {
      StorageDB.setSession({
        userId: employer.id,
        role: 'employer',
        name: employer.name,
        phone: employer.phone
      });
      return employer;
    }
    return null;
  }
};

window.AuthManager = AuthManager;
