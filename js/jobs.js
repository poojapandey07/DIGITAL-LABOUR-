/**
 * DIGITAL LABOR CHOWK - JOB & APPLICATION ENGINE (js/jobs.js)
 * Refactored to communicate with the FastAPI REST API backend.
 */

const JobManager = {
  /**
   * List and filter jobs from GET /api/jobs
   */
  async filterJobs(criteria = {}) {
    const params = {
      q: criteria.keyword || "",
      category: criteria.category || "",
      location: criteria.location || "",
      min_wage: criteria.minWage || 0,
      max_wage: criteria.maxWage || 0,
      duration_type: criteria.duration || "",
      sort: criteria.sortBy === "wage_high" ? "wage_desc" : criteria.sortBy === "wage_low" ? "wage_asc" : "newest",
      page: criteria.page || 1,
      limit: criteria.limit || 50
    };

    try {
      const res = await window.apiClient.listJobs(params);
      return res.items || [];
    } catch (err) {
      console.error("[Jobs] Failed to fetch jobs:", err);
      throw err;
    }
  },

  /**
   * Get single job by ID from GET /api/jobs/{id}
   */
  async getJobById(id) {
    return window.apiClient.getJobDetail(id);
  },

  /**
   * Create a new job posting via POST /api/jobs
   */
  async createJob(jobData) {
    const payload = {
      title: jobData.title.trim(),
      category: jobData.category.trim(),
      description: jobData.description ? jobData.description.trim() : "",
      location: jobData.location.trim(),
      address: jobData.address ? jobData.address.trim() : "",
      wage: parseInt(jobData.wage, 10),
      wage_type: jobData.wageType || "per_day",
      workers_needed: parseInt(jobData.workersNeeded, 10) || 1,
      duration_type: jobData.duration || "one_day",
      contact_phone: jobData.contactPhone ? jobData.contactPhone.trim() : ""
    };

    try {
      const job = await window.apiClient.createJob(payload);
      return { success: true, job };
    } catch (err) {
      return { success: false, message: err.message || "कार्य पोस्ट करने में विफल" };
    }
  },

  /**
   * Delete a job posting via DELETE /api/jobs/{id}
   */
  async deleteJob(id) {
    try {
      await window.apiClient.deleteJob(id);
      return true;
    } catch (err) {
      console.error("[Jobs] Delete failed:", err);
      return false;
    }
  },

  /**
   * Toggle job active status via PUT /api/jobs/{id}
   */
  async toggleJobStatus(id, currentStatus) {
    try {
      const updated = await window.apiClient.updateJob(id, { is_active: !currentStatus });
      return updated;
    } catch (err) {
      console.error("[Jobs] Status toggle failed:", err);
      return null;
    }
  },

  /**
   * List jobs posted by employer via GET /api/employers/{id}/jobs
   */
  async getJobsByEmployer(employerId) {
    try {
      return await window.apiClient.getEmployerJobs(employerId);
    } catch (err) {
      console.error("[Jobs] Fetch employer jobs failed:", err);
      return [];
    }
  },

  /**
   * Worker applies to a job via POST /api/applications
   */
  async applyForJob(jobId) {
    try {
      const application = await window.apiClient.applyToJob(jobId);
      return { success: true, application };
    } catch (err) {
      return { success: false, message: err.message || "आवेदन करने में विफल" };
    }
  },

  /**
   * List applications for worker via GET /api/workers/{id}/applications
   */
  async getApplicationsForWorker(workerId) {
    try {
      return await window.apiClient.getWorkerApplications(workerId);
    } catch (err) {
      console.error("[Jobs] Fetch worker applications failed:", err);
      return [];
    }
  },

  /**
   * List applicants for a job via GET /api/employers/{employerId}/jobs/{jobId}/applicants
   */
  async getApplicationsForJob(jobId, employerId) {
    try {
      const empId = employerId || window.apiClient?.getUser()?.id;
      if (!empId) return [];
      return await window.apiClient.getJobApplicants(empId, jobId);
    } catch (err) {
      console.error("[Jobs] Fetch job applicants failed:", err);
      return [];
    }
  },

  /**
   * Employer updates application status via PATCH /api/applications/{id}/status
   */
  async updateApplicationStatus(appId, newStatus) {
    try {
      const statusVal = (newStatus || "").toLowerCase();
      const updated = await window.apiClient.updateApplicationStatus(appId, statusVal);
      return { success: true, application: updated };
    } catch (err) {
      return { success: false, message: err.message || "स्थिति अपडेट करने में विफल" };
    }
  },

  /**
   * Fetch worker dashboard summary from GET /api/workers/{id}/dashboard
   */
  async getWorkerDashboard(workerId) {
    try {
      return await window.apiClient.getWorkerDashboard(workerId);
    } catch (err) {
      console.error("[Jobs] Fetch dashboard failed:", err);
      return { applications_count: 0, matching_jobs_count: 0, profile_completion_pct: 70 };
    }
  },

  /**
   * Format duration label
   */
  formatDuration(duration) {
    switch (duration) {
      case "one_day":
      case "one-day":
        return "1 दिन का कार्य (1 Day)";
      case "multi_day":
      case "multi-day":
        return "कुछ दिन (Multi-day)";
      case "ongoing":
        return "दीर्घकालिक (Ongoing)";
      default:
        return duration || "सामान्य";
    }
  },

  /**
   * Format relative time
   */
  timeAgo(isoString) {
    if (!isoString) return "हाल ही में";
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "अभी-अभी (Just now)";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} मि. पहले`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} घंटे पहले`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} दिन पहले`;
  }
};

window.JobManager = JobManager;
