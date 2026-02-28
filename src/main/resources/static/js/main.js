// API endpoints
const API_BASE = window.location.origin;
const API_STATUS = `${API_BASE}/api/status`;
const API_HEALTH = `${API_BASE}/api/health`;
const API_INFO = `${API_BASE}/api/info`;

// Fetch and update application status
async function fetchApplicationStatus() {
  try {
    const response = await fetch(API_STATUS);
    const data = await response.json();

    // Update version
    const versionElements = document.querySelectorAll(".stat-value");
    if (versionElements[0]) {
      versionElements[0].textContent = data.version;
    }

    // Update build status
    if (versionElements[2]) {
      versionElements[2].textContent =
        data.buildStatus === "passing" ? "Passing" : "Failed";
    }

    // Update uptime with real server uptime
    const uptimeElement = document.getElementById("uptime");
    if (uptimeElement && data.uptimeFormatted) {
      uptimeElement.textContent = data.uptimeFormatted;
    }

    console.log("📊 Application Status:", data);
  } catch (error) {
    console.error("Failed to fetch application status:", error);
  }
}

// Fetch and update health status
async function fetchHealthStatus() {
  try {
    const response = await fetch(API_HEALTH);
    const data = await response.json();

    // Update health status
    const statusText = document.querySelector(".status-text");
    const statusIndicator = document.querySelector(".status-indicator");

    if (statusText) {
      statusText.textContent = data.healthy ? "Healthy" : "Unhealthy";
    }

    if (statusIndicator) {
      if (data.healthy) {
        statusIndicator.classList.add("healthy");
        statusIndicator.classList.remove("unhealthy");
      } else {
        statusIndicator.classList.add("unhealthy");
        statusIndicator.classList.remove("healthy");
      }
    }

    // Update live indicator status
    const liveIndicator = document.querySelector(".live-indicator");
    if (liveIndicator && data.healthy) {
      liveIndicator.textContent = "Live";
    }

    console.log("💚 Health Status:", data);
  } catch (error) {
    console.error("Failed to fetch health status:", error);

    // Mark as unhealthy if API fails
    const statusText = document.querySelector(".status-text");
    const statusIndicator = document.querySelector(".status-indicator");

    if (statusText) {
      statusText.textContent = "Unavailable";
    }

    if (statusIndicator) {
      statusIndicator.classList.remove("healthy");
      statusIndicator.classList.add("unhealthy");
    }
  }
}

// Fetch application info
async function fetchApplicationInfo() {
  try {
    const response = await fetch(API_INFO);
    const data = await response.json();

    console.log("ℹ️ Application Info:", data);
  } catch (error) {
    console.error("Failed to fetch application info:", error);
  }
}

// Update all data periodically
function updateAllData() {
  fetchApplicationStatus();
  fetchHealthStatus();
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(30px)";
    section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(section);
  });

  // Fetch initial data
  updateAllData();
  fetchApplicationInfo();

  // Update data every 5 seconds
  setInterval(updateAllData, 5000);
});

// Log application status
window.addEventListener("load", function () {
  console.log("✅ CI/CD Pipeline Demo Application Loaded Successfully");
  console.log("🚀 Spring Boot Application is Running");
  console.log(
    "🔧 Built with Maven | 🐳 Containerized with Docker | ☸️ Deployed on Kubernetes",
  );
  console.log("📡 Fetching real-time data from backend APIs...");
});
