/**
 * DIGITAL LABOR CHOWK - AUTHENTICATION & SESSION MANAGER (js/auth.js)
 * Connects login, signup, session inspection, and demo logins to the FastAPI REST API.
 */

const AuthManager = {
  /**
   * Get current session info from JWT cache
   */
  getSession() {
    const user = this.getCurrentUser();
    if (!user) return null;
    return {
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      company: user.company_name
    };
  },

  /**
   * Get current user profile from stored user
   */
  getCurrentUser() {
    if (window.apiClient) {
      return window.apiClient.getUser();
    }
    return null;
  },

  /**
   * Check if user has an active JWT session
   */
  isLoggedIn() {
    if (window.apiClient) {
      return !!window.apiClient.getToken();
    }
    return false;
  },

  isWorker() {
    const user = this.getCurrentUser();
    return !!user && user.role === "worker";
  },

  isEmployer() {
    const user = this.getCurrentUser();
    return !!user && user.role === "employer";
  },

  isValidPhone(phone) {
    const clean = String(phone).trim().replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(clean);
  },

  /**
   * Login user via POST /api/auth/login
   */
  async login(phone, password, expectedRole = null) {
    const cleanPhone = String(phone).trim().replace(/\D/g, "");
    if (!cleanPhone || !password) {
      return { success: false, message: "कृपया मोबाइल नंबर और पासवर्ड दर्ज करें (Enter phone & password)" };
    }

    try {
      const res = await window.apiClient.login(cleanPhone, password, expectedRole);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || "लॉगिन विफल (Login failed)" };
    }
  },

  /**
   * Register worker via POST /api/auth/signup
   */
  async registerWorker(data) {
    const { name, phone, password, primarySkill, location, experience, dailyWage, bio } = data;

    if (!name || name.trim().length < 2) {
      return { success: false, message: "कृपया अपना पूरा नाम दर्ज करें (Enter full name)" };
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, "");
    if (!this.isValidPhone(cleanPhone)) {
      return { success: false, message: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile)" };
    }

    if (!password || password.length < 4) {
      return { success: false, message: "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password min 4 chars)" };
    }

    if (!primarySkill) {
      return { success: false, message: "कृपया अपना मुख्य ट्रेड/कौशल चुनें (Select trade)" };
    }

    if (!location) {
      return { success: false, message: "कृपया अपना शहर/स्थान चुनें (Select location)" };
    }

    const payload = {
      name: name.trim(),
      phone: cleanPhone,
      password: password,
      role: "worker",
      location: location.trim(),
      skills: [primarySkill],
      experience_years: experience || "1",
      daily_wage: dailyWage ? parseInt(dailyWage, 10) : 700,
      bio: bio || ""
    };

    try {
      const res = await window.apiClient.signup(payload);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || "पंजीकरण विफल (Registration failed)" };
    }
  },

  /**
   * Register employer via POST /api/auth/signup
   */
  async registerEmployer(data) {
    const { companyName, contactPerson, phone, password, businessType, location, address } = data;

    if (!companyName || companyName.trim().length < 2) {
      return { success: false, message: "कृपया कंपनी या नियोक्ता का नाम दर्ज करें (Enter company name)" };
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, "");
    if (!this.isValidPhone(cleanPhone)) {
      return { success: false, message: "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile)" };
    }

    if (!password || password.length < 4) {
      return { success: false, message: "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password min 4 chars)" };
    }

    if (!businessType) {
      return { success: false, message: "कृपया व्यवसाय का प्रकार चुनें (Select business type)" };
    }

    if (!location) {
      return { success: false, message: "कृपया अपना शहर चुनें (Select city)" };
    }

    const payload = {
      name: contactPerson ? contactPerson.trim() : companyName.trim(),
      phone: cleanPhone,
      password: password,
      role: "employer",
      location: location.trim(),
      company_name: companyName.trim(),
      business_type: businessType,
      contact_person: contactPerson ? contactPerson.trim() : companyName.trim()
    };

    try {
      const res = await window.apiClient.signup(payload);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || "पंजीकरण विफल (Registration failed)" };
    }
  },

  /**
   * Logout session and clear JWT
   */
  logout(redirectTarget = "../index.html") {
    if (window.apiClient) {
      window.apiClient.clearSession();
    }
    if (typeof showToast === "function") {
      showToast("सफलतापूर्वक लॉगआउट किया गया (Logged out successfully)", "info");
    }
    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 400);
  },

  /**
   * Route Guard: verify user is authenticated with required role
   */
  requireAuth(requiredRole = "any", redirectUrl = "") {
    const user = this.getCurrentUser();
    const token = window.apiClient ? window.apiClient.getToken() : null;

    if (!token || !user) {
      const defaultLogin = requiredRole === "employer" ? "employer-login.html" : "worker-login.html";
      sessionStorage.setItem("dlc_auth_redirect", window.location.href);
      window.location.href = redirectUrl || defaultLogin;
      return false;
    }

    if (requiredRole !== "any" && user.role !== requiredRole) {
      const correctLogin = requiredRole === "employer" ? "employer-login.html" : "worker-login.html";
      window.location.href = redirectUrl || correctLogin;
      return false;
    }

    return true;
  },

  /**
   * One-click demo worker login
   */
  async demoWorkerLogin() {
    return this.login("9876543210", "password123", "worker");
  },

  /**
   * One-click demo employer login
   */
  async demoEmployerLogin() {
    return this.login("9899001122", "password123", "employer");
  }
};

window.AuthManager = AuthManager;
