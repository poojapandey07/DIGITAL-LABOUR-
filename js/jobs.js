/**
 * DIGITAL LABOR CHOWK - JOB & APPLICATION ENGINE (js/jobs.js)
 * Handles job CRUD, multi-criteria search & filtering, worker applications, and status updates.
 */

const JobManager = {
  /**
   * Get all active and listed jobs
   */
  getAllJobs() {
    return StorageDB.getJobs();
  },

  /**
   * Get a single job by its ID
   */
  getJobById(id) {
    return StorageDB.getJobById(id);
  },

  /**
   * Create a new job posting
   */
  createJob(jobData) {
    const session = AuthManager.getSession();
    if (!session || session.role !== 'employer') {
      return { success: false, message: 'नौकरी पोस्ट करने के लिए नियोक्ता लॉगिन आवश्यक है (Employer login required)' };
    }

    const {
      title,
      category,
      description,
      location,
      address,
      wage,
      wageType = 'per day',
      workersNeeded,
      duration,
      contactPhone
    } = jobData;

    if (!title || title.trim().length < 3) {
      return { success: false, message: 'कृपया नौकरी का शीर्षक दर्ज करें (Enter job title)' };
    }

    if (!category) {
      return { success: false, message: 'कृपया कार्य श्रेणी/कौशल चुनें (Select category/skill)' };
    }

    if (!location) {
      return { success: false, message: 'कृपया कार्य का शहर/स्थान चुनें (Select location)' };
    }

    const numWage = parseInt(wage, 10);
    if (isNaN(numWage) || numWage <= 0) {
      return { success: false, message: 'कृपया वैध मजदूरी राशि दर्ज करें (Enter valid daily wage)' };
    }

    const numWorkers = parseInt(workersNeeded, 10);
    if (isNaN(numWorkers) || numWorkers <= 0) {
      return { success: false, message: 'कृपया आवश्यक श्रमिकों की संख्या बताएं (Enter workers needed)' };
    }

    const newJob = {
      id: 'job-' + Date.now(),
      employerId: session.userId,
      employerName: session.name,
      title: title.trim(),
      category: category,
      description: description ? description.trim() : 'दैनिक मजदूरी कार्य (Daily wage labor work)',
      location: location,
      address: address ? address.trim() : location,
      wage: numWage,
      wageType: wageType,
      workersNeeded: numWorkers,
      duration: duration || 'one-day',
      contactPhone: contactPhone || session.phone,
      status: 'active',
      postedAt: new Date().toISOString()
    };

    StorageDB.saveJob(newJob);
    return { success: true, job: newJob };
  },

  /**
   * Delete a job posting
   */
  deleteJob(id) {
    return StorageDB.deleteJob(id);
  },

  /**
   * Toggle job status (active / closed)
   */
  toggleJobStatus(id) {
    const job = this.getJobById(id);
    if (!job) return false;
    job.status = job.status === 'active' ? 'closed' : 'active';
    StorageDB.saveJob(job);
    return job;
  },

  /**
   * Get all jobs posted by a specific employer
   */
  getJobsByEmployer(employerId) {
    const jobs = this.getAllJobs();
    return jobs.filter(j => j.employerId === employerId);
  },

  /**
   * Check if a worker has applied for a job
   */
  hasWorkerApplied(jobId, workerId) {
    if (!workerId) return false;
    const apps = StorageDB.getApplications();
    return apps.some(a => a.jobId === jobId && a.workerId === workerId);
  },

  /**
   * Worker applies for a job
   */
  applyForJob(jobId, workerUser) {
    if (!workerUser || workerUser.role !== 'worker') {
      return { success: false, message: 'आवेदन करने के लिए श्रमिक लॉगिन आवश्यक है (Worker login required to apply)' };
    }

    const job = this.getJobById(jobId);
    if (!job) {
      return { success: false, message: 'कार्य उपलब्ध नहीं है (Job not found)' };
    }

    if (this.hasWorkerApplied(jobId, workerUser.id)) {
      return { success: false, message: 'आप पहले ही इस कार्य के लिए आवेदन कर चुके हैं (Already applied)' };
    }

    const newApplication = {
      id: 'app-' + Date.now(),
      jobId: jobId,
      jobTitle: job.title,
      employerName: job.employerName,
      workerId: workerUser.id,
      workerName: workerUser.name,
      workerPhone: workerUser.phone,
      workerSkill: workerUser.primarySkill || 'मजदूर',
      workerExperience: workerUser.experience || '1',
      appliedAt: new Date().toISOString(),
      status: 'Applied' // 'Applied' | 'Viewed' | 'Shortlisted' | 'Selected'
    };

    StorageDB.addApplication(newApplication);
    return { success: true, application: newApplication };
  },

  /**
   * Get all applications submitted by a worker
   */
  getApplicationsForWorker(workerId) {
    const allApps = StorageDB.getApplications().filter(a => a.workerId === workerId);
    const allJobs = this.getAllJobs();

    // Attach current job data to each application
    return allApps.map(app => {
      const job = allJobs.find(j => j.id === app.jobId);
      return {
        ...app,
        job: job || {
          title: app.jobTitle || 'कार्य (Job Listing)',
          location: 'स्थान अनुपलब्ध',
          wage: '—',
          status: 'closed'
        }
      };
    });
  },

  /**
   * Get all applicants for an employer's job
   */
  getApplicationsForJob(jobId) {
    const apps = StorageDB.getApplications().filter(a => a.jobId === jobId);
    const users = StorageDB.getUsers();

    return apps.map(app => {
      const worker = users.find(u => u.id === app.workerId);
      return {
        ...app,
        worker: worker || {
          name: app.workerName,
          phone: app.workerPhone,
          primarySkill: app.workerSkill
        }
      };
    });
  },

  /**
   * Update status of an application (e.g. Shortlisted, Selected)
   */
  updateApplicationStatus(appId, newStatus) {
    const apps = StorageDB.getApplications();
    const app = apps.find(a => a.id === appId);
    if (!app) return false;
    app.status = newStatus;
    StorageDB.saveApplications(apps);
    return true;
  },

  /**
   * Recommend jobs matching a worker's trade and location
   */
  getRecommendedJobs(workerUser, limit = 4) {
    if (!workerUser) return this.getAllJobs().slice(0, limit);

    const allJobs = this.getAllJobs().filter(j => j.status === 'active');
    const workerTrade = (workerUser.primarySkill || '').toLowerCase();
    const workerSkills = (workerUser.skills || []).map(s => s.toLowerCase());
    const workerCity = (workerUser.location || '').toLowerCase();

    // Score jobs by relevance
    const scoredJobs = allJobs.map(job => {
      let score = 0;
      const jobCat = (job.category || '').toLowerCase();
      const jobLoc = (job.location || '').toLowerCase();
      const jobTitle = (job.title || '').toLowerCase();

      // Primary trade match
      if (jobCat.includes(workerTrade) || workerTrade.includes(jobCat)) score += 10;
      // Additional skills match
      workerSkills.forEach(skill => {
        if (jobCat.includes(skill) || jobTitle.includes(skill)) score += 5;
      });
      // Location match
      if (jobLoc.includes(workerCity) || workerCity.includes(jobLoc)) score += 4;

      return { job, score };
    });

    // Sort by score descending, then by posted date
    scoredJobs.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.job.postedAt) - new Date(a.job.postedAt);
    });

    return scoredJobs.slice(0, limit).map(item => item.job);
  },

  /**
   * Filter and sort jobs based on search criteria
   */
  filterJobs({ keyword = '', category = '', location = '', minWage = 0, maxWage = 0, duration = '', sortBy = 'newest' }) {
    let jobs = this.getAllJobs().filter(j => j.status === 'active');

    // Keyword filter
    if (keyword && keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      jobs = jobs.filter(j => 
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q)) ||
        (j.employerName && j.employerName.toLowerCase().includes(q)) ||
        (j.category && j.category.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      jobs = jobs.filter(j => j.category && j.category.toLowerCase().includes(catLower));
    }

    // Location filter
    if (location && location !== 'all') {
      const locLower = location.toLowerCase();
      jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(locLower));
    }

    // Wage filter
    if (minWage && parseInt(minWage, 10) > 0) {
      jobs = jobs.filter(j => j.wage >= parseInt(minWage, 10));
    }
    if (maxWage && parseInt(maxWage, 10) > 0) {
      jobs = jobs.filter(j => j.wage <= parseInt(maxWage, 10));
    }

    // Duration filter
    if (duration && duration !== 'all') {
      jobs = jobs.filter(j => j.duration === duration);
    }

    // Sorting
    if (sortBy === 'wage_high') {
      jobs.sort((a, b) => b.wage - a.wage);
    } else if (sortBy === 'wage_low') {
      jobs.sort((a, b) => a.wage - b.wage);
    } else {
      // Default: Newest first
      jobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    }

    return jobs;
  },

  /**
   * Format duration label with Hindi translation
   */
  formatDuration(duration) {
    switch (duration) {
      case 'one-day': return '1 दिन का कार्य (1 Day)';
      case 'multi-day': return 'कुछ दिन (Multi-day)';
      case 'ongoing': return 'दीर्घकालिक (Ongoing)';
      default: return duration;
    }
  },

  /**
   * Format relative time (e.g. '2 घंटे पहले / 2 hrs ago')
   */
  timeAgo(isoString) {
    if (!isoString) return 'हाल ही में (Recently)';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'अभी-अभी (Just now)';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} मि. पहले (${diffMin}m ago)`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} घंटे पहले (${diffHr}h ago)`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} दिन पहले (${diffDays}d ago)`;
  }
};

window.JobManager = JobManager;
