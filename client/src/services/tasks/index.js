export const TASK_STATUSES = ["To Do", "In Progress", "Review", "Blocked", "Done", "Cancelled"];

export const TASK_STATUS_COLORS = {
  "To Do": "#6b7a8d",
  "In Progress": "#4a90d9",
  Review: "#9b59b6",
  Blocked: "#e74c3c",
  Done: "#27ae60",
  Cancelled: "#95a5a6",
};

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];

export const TASK_PRIORITY_COLORS = {
  Low: "#8a94a6",
  Medium: "#f5a623",
  High: "#e74c3c",
  Critical: "#9b59b6",
};

export const TASK_ASSIGNEES = ["James Reyes", "Ana Lim", "Sofia Mendoza", "Carlos Torres"];

export const mockTasks = [
  {
    id: 1,
    title: "Setup development environment",
    project: "ERP Implementation – Accenture PH",
    projectId: 1,
    status: "Done",
    priority: "High",
    assignee: "James Reyes",
    dueDate: "2026-04-10",
    tags: ["Dev", "Setup"],
    notes: "Configure Docker, database, and local environment.",
    subtasks: [
      { id: 1, title: "Install dependencies", done: true },
      { id: 2, title: "Configure .env", done: true },
    ],
    activities: [
      { id: 1, type: "note", user: "James Reyes", date: "2026-04-08", note: "Completed setup." },
    ],
    created: "2026-04-05",
  },
  {
    id: 2,
    title: "Design database schema",
    project: "ERP Implementation – Accenture PH",
    projectId: 1,
    status: "In Progress",
    priority: "High",
    assignee: "James Reyes",
    dueDate: "2026-05-10",
    tags: ["DB", "Architecture"],
    notes: "ERD design for inventory and HR modules.",
    subtasks: [
      { id: 1, title: "Inventory tables", done: true },
      { id: 2, title: "HR tables", done: false },
      { id: 3, title: "Finance tables", done: false },
    ],
    activities: [],
    created: "2026-04-20",
  },
  {
    id: 3,
    title: "Payment gateway approval",
    project: "E-Commerce Portal – EComm Hub",
    projectId: 5,
    status: "Blocked",
    priority: "Critical",
    assignee: "Sofia Mendoza",
    dueDate: "2026-05-08",
    tags: ["Blocked", "Payment"],
    notes: "Waiting on client to confirm preferred payment vendor.",
    subtasks: [],
    activities: [
      { id: 1, type: "note", user: "Sofia Mendoza", date: "2026-04-30", note: "Escalated to account manager." },
    ],
    created: "2026-04-25",
  },
  {
    id: 4,
    title: "Final dashboard delivery",
    project: "Analytics Dashboard – FinServe PH",
    projectId: 3,
    status: "Review",
    priority: "High",
    assignee: "Ana Lim",
    dueDate: "2026-05-30",
    tags: ["Delivery"],
    notes: "Package and hand over final build.",
    subtasks: [],
    activities: [],
    created: "2026-05-01",
  },
  {
    id: 5,
    title: "Scope definition document",
    project: "HR Module – RetailMax PH",
    projectId: 4,
    status: "To Do",
    priority: "Medium",
    assignee: "Carlos Torres",
    dueDate: "2026-05-20",
    tags: ["Planning", "Docs"],
    notes: "",
    subtasks: [],
    activities: [],
    created: "2026-05-05",
  },
];

export async function getTasksData() {
  return {
    tasks: mockTasks,
    statuses: TASK_STATUSES,
    priorities: TASK_PRIORITIES,
    assignees: TASK_ASSIGNEES,
  };
}

export async function createTask(data) {
  return { ...data, id: Date.now() };
}

export async function updateTask(id, data) {
  return { id, ...data };
}

export async function deleteTask(id) {
  return { id };
}
