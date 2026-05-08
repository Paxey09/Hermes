export const PROJECT_STAGES = [
  "Planning",
  "Kickoff",
  "In Progress",
  "Review",
  "Blocked",
  "Completed",
  "Cancelled",
];

export const PROJECT_STAGE_COLORS = {
  Planning: "#8b5cf6",
  Kickoff: "#4a90d9",
  "In Progress": "#f5a623",
  Review: "#9b59b6",
  Blocked: "#e74c3c",
  Completed: "#27ae60",
  Cancelled: "#95a5a6",
};

export const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"];

export const PROJECT_MEMBERS = [
  "James Reyes",
  "Ana Lim",
  "Sofia Mendoza",
  "Carlos Torres",
];

export const SERVICE_CATEGORIES = [
  "AI Social Media Ads",
  "Landing Page Creation",
  "CRM & ERP Solutions",
  "AI Chatbot Autoreplies",
  "Data Analytics & Research",
  "Photo & Video Shoots",
  "Cybersecurity Protection",
];

export const mockProjects = [
  {
    id: 1,
    name: "AI Social Media Ads Campaign – RetailMax PH",
    customer: "RetailMax PH",
    contact: "Sofia Mendoza",
    linkedDeal: "AI Ads Growth Package",
    serviceCategory: "AI Social Media Ads",
    servicePackage: "Growth Campaign Package",
    stage: "Kickoff",
    priority: "High",
    status: "active",
    progress: 25,
    startDate: "2026-05-01",
    dueDate: "2026-06-30",
    manager: "Ana Lim",
    team: ["Ana Lim", "Carlos Torres"],
    tags: ["AI Ads", "Marketing", "Growth"],
    description:
      "AI-assisted social media campaign setup, audience targeting, creative testing, and weekly performance reporting.",
    deliverables: [
      { id: 1, title: "Campaign strategy", dueDate: "2026-05-07", done: true },
      { id: 2, title: "Audience targeting setup", dueDate: "2026-05-12", done: false },
      { id: 3, title: "Ad copy and creative variants", dueDate: "2026-05-20", done: false },
      { id: 4, title: "Weekly campaign report", dueDate: "2026-06-30", done: false },
    ],
    milestones: [
      { id: 1, name: "Strategy Approval", dueDate: "2026-05-07", done: true },
      { id: 2, name: "Campaign Launch", dueDate: "2026-05-20", done: false },
      { id: 3, name: "Optimization Review", dueDate: "2026-06-15", done: false },
    ],
    activities: [
      {
        id: 1,
        type: "email",
        user: "Ana Lim",
        date: "2026-05-02",
        note: "Sent campaign strategy draft to client.",
      },
    ],
  },
  {
    id: 2,
    name: "Landing Page Build – FinServe PH",
    customer: "FinServe PH",
    contact: "Lisa Chen",
    linkedDeal: "Landing Page Creation",
    serviceCategory: "Landing Page Creation",
    servicePackage: "Conversion Landing Page",
    stage: "Review",
    priority: "Medium",
    status: "active",
    progress: 80,
    startDate: "2026-03-15",
    dueDate: "2026-05-30",
    manager: "Ana Lim",
    team: ["Ana Lim"],
    tags: ["Landing Page", "Finance"],
    description:
      "Landing page design and build for lead generation, including form capture and analytics tracking.",
    deliverables: [
      { id: 1, title: "Wireframe", dueDate: "2026-03-25", done: true },
      { id: 2, title: "UI design", dueDate: "2026-04-10", done: true },
      { id: 3, title: "Responsive build", dueDate: "2026-04-25", done: true },
      { id: 4, title: "Final review", dueDate: "2026-05-30", done: false },
    ],
    milestones: [
      { id: 1, name: "Design Approval", dueDate: "2026-03-25", done: true },
      { id: 2, name: "Build Complete", dueDate: "2026-04-25", done: true },
      { id: 3, name: "Client Review", dueDate: "2026-05-15", done: false },
      { id: 4, name: "Final Delivery", dueDate: "2026-05-30", done: false },
    ],
    activities: [
      {
        id: 1,
        type: "meeting",
        user: "Ana Lim",
        date: "2026-05-01",
        note: "Client review session scheduled.",
      },
    ],
  },
  {
    id: 3,
    name: "CRM & ERP Solution Setup – Accenture PH",
    customer: "Accenture PH",
    contact: "Maria Santos",
    linkedDeal: "Enterprise ERP Migration",
    serviceCategory: "CRM & ERP Solutions",
    servicePackage: "Implementation Support Package",
    stage: "In Progress",
    priority: "High",
    status: "active",
    progress: 45,
    startDate: "2026-04-01",
    dueDate: "2026-08-31",
    manager: "James Reyes",
    team: ["James Reyes", "Ana Lim"],
    tags: ["CRM", "ERP", "Implementation"],
    description:
      "Service delivery work for CRM/ERP setup, onboarding, data migration, training, and client handover. Module access itself is handled separately in ERP Control.",
    deliverables: [
      { id: 1, title: "Requirements gathering", dueDate: "2026-04-15", done: true },
      { id: 2, title: "Data migration checklist", dueDate: "2026-05-05", done: true },
      { id: 3, title: "Client onboarding session", dueDate: "2026-06-15", done: false },
      { id: 4, title: "Go-live support", dueDate: "2026-08-31", done: false },
    ],
    milestones: [
      { id: 1, name: "Requirements Gathering", dueDate: "2026-04-15", done: true },
      { id: 2, name: "Setup Support", dueDate: "2026-05-01", done: true },
      { id: 3, name: "Training Sprint", dueDate: "2026-06-15", done: false },
      { id: 4, name: "UAT", dueDate: "2026-07-15", done: false },
      { id: 5, name: "Go-Live", dueDate: "2026-08-31", done: false },
    ],
    activities: [
      {
        id: 1,
        type: "note",
        user: "James Reyes",
        date: "2026-05-01",
        note: "Client setup support started. ERP module access will be controlled from ERP Control.",
      },
    ],
  },
  {
    id: 4,
    name: "Cybersecurity Protection Setup – EComm Hub",
    customer: "EComm Hub",
    contact: "Raj Patel",
    linkedDeal: "Cybersecurity Protection Add-on",
    serviceCategory: "Cybersecurity Protection",
    servicePackage: "Security Protection Add-on",
    stage: "Blocked",
    priority: "High",
    status: "blocked",
    progress: 30,
    startDate: "2026-04-01",
    dueDate: "2026-08-01",
    manager: "Sofia Mendoza",
    team: ["Sofia Mendoza"],
    tags: ["Security", "Blocked"],
    description:
      "Security hardening, vulnerability scanning, and protection setup for client digital assets.",
    deliverables: [
      { id: 1, title: "Security audit", dueDate: "2026-04-15", done: true },
      { id: 2, title: "Protection rules setup", dueDate: "2026-05-15", done: false },
      { id: 3, title: "Final security report", dueDate: "2026-08-01", done: false },
    ],
    milestones: [
      { id: 1, name: "Initial Audit", dueDate: "2026-04-15", done: true },
      { id: 2, name: "Protection Setup", dueDate: "2026-05-15", done: false },
    ],
    activities: [
      {
        id: 1,
        type: "note",
        user: "Sofia Mendoza",
        date: "2026-04-30",
        note: "Blocked pending client access credentials.",
      },
    ],
  },
];

export async function getProjectsData() {
  return {
    projects: mockProjects,
    stages: PROJECT_STAGES,
    priorities: PROJECT_PRIORITIES,
    members: PROJECT_MEMBERS,
    serviceCategories: SERVICE_CATEGORIES,
  };
}

export async function createProject(data) {
  return { ...data, id: Date.now() };
}

export async function updateProject(id, data) {
  return { id, ...data };
}

export async function deleteProject(id) {
  return { id };
}
