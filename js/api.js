/**
 * DIGITAL LABOR CHOWK - REST API CLIENT (js/api.js)
 * Wraps all HTTP fetch calls to the FastAPI backend, manages JWT bearer tokens,
 * and formats standardized error messages for toast alerts.
 */

const API_BASE = window.DLC_API_BASE || "http://localhost:8000/api";
const TOKEN_KEY = "dlc_jwt_token";
const USER_KEY = "dlc_current_user";

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Token management
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  setToken(token, persist = true) {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  // Cached user profile management
  getUser() {
    try {
      const u = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  setUser(user, persist = true) {
    if (persist) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  clearUser() {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  clearSession() {
    this.clearToken();
    this.clearUser();
    localStorage.removeItem("dlc_current_session");
  }

  /**
   * Generic fetch wrapper with automatic JWT authorization and error normalization
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        let errorMsg = "सर्वर त्रुटि (Server Error)";
        if (data && typeof data === "object" && data.detail) {
          if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(d => d.msg || d.message).join(", ");
          } else {
            errorMsg = data.detail;
          }
        } else if (typeof data === "string") {
          errorMsg = data;
        }

        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Network or offline error
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        console.warn(`[API] Unable to reach backend at ${this.baseUrl}. Is the FastAPI server running on port 8000?`);
        const networkError = new Error("सर्वर से संपर्क नहीं हो सका। कृपया सुनिश्चित करें कि बैकएंड सर्वर पोर्ट 8000 पर चल रहा है। (Cannot connect to backend server)");
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }

  // Health check
  async checkHealth() {
    try {
      const res = await this.get("/health");
      return res && res.status === "healthy";
    } catch (e) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // API Resource Methods
  // --------------------------------------------------------------------------

  // Auth
  async signup(userData) {
    const res = await this.post("/auth/signup", userData);
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }

  async login(phone, password, expectedRole = null) {
    const payload = { phone, password };
    if (expectedRole) payload.expected_role = expectedRole;

    const res = await this.post("/auth/login", payload);
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }

  async getMe() {
    const user = await this.get("/auth/me");
    this.setUser(user);
    return user;
  }

  // Workers
  async getWorkerProfile(id) {
    return this.get(`/workers/${id}`);
  }

  async updateWorkerProfile(id, profileData) {
    const updated = await this.put(`/workers/${id}`, profileData);
    this.setUser(updated);
    return updated;
  }

  async getWorkerDashboard(id) {
    return this.get(`/workers/${id}/dashboard`);
  }

  async getWorkerApplications(id) {
    return this.get(`/workers/${id}/applications`);
  }

  // Employers
  async getEmployerJobs(id) {
    return this.get(`/employers/${id}/jobs`);
  }

  async getJobApplicants(employerId, jobId) {
    return this.get(`/employers/${employerId}/jobs/${jobId}/applicants`);
  }

  // Jobs
  async listJobs(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.category && params.category !== "all") query.append("category", params.category);
    if (params.location && params.location !== "all") query.append("location", params.location);
    if (params.min_wage && parseInt(params.min_wage, 10) > 0) query.append("min_wage", params.min_wage);
    if (params.max_wage && parseInt(params.max_wage, 10) > 0) query.append("max_wage", params.max_wage);
    if (params.duration_type && params.duration_type !== "all") query.append("duration_type", params.duration_type);
    if (params.sort) query.append("sort", params.sort);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString();
    const endpoint = queryString ? `/jobs?${queryString}` : "/jobs";
    return this.get(endpoint);
  }

  async getJobDetail(id) {
    return this.get(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.post("/jobs", jobData);
  }

  async updateJob(id, jobData) {
    return this.put(`/jobs/${id}`, jobData);
  }

  async deleteJob(id) {
    return this.delete(`/jobs/${id}`);
  }

  // Applications
  async applyToJob(jobId) {
    return this.post("/applications", { job_id: parseInt(jobId, 10) });
  }

  async getApplication(id) {
    return this.get(`/applications/${id}`);
  }

  async updateApplicationStatus(id, newStatus) {
    return this.patch(`/applications/${id}/status`, { status: newStatus });
  }
}

// Global API instance
window.apiClient = new ApiClient(API_BASE);
