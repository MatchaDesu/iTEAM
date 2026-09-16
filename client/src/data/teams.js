const teams = [
  {
    id: 1,
    name: "Campus Connect",
    description:
      "Building a modern web application to help university students connect and collaborate.",
    category: "Web",
    members: 3,
    maxMembers: 5,
    usePositions: true,

    positions: [
      {
        id: 101,
        positionId: "frontend-developer",
        name: "Frontend Developer",
        maxMembers: 1,
      },
      {
        id: 102,
        positionId: "backend-developer",
        name: "Backend Developer",
        maxMembers: 1,
      },
      {
        id: 103,
        positionId: "ui-ux-designer",
        name: "UI/UX Designer",
        maxMembers: 2,
      },
    ],

    teamMembers: [
      {
        id: 1001,
        name: "Alex",
        positionId: 101,
        positionName: "Frontend Developer",
      },
      {
        id: 1002,
        name: "Beam",
        positionId: 102,
        positionName: "Backend Developer",
      },
      {
        id: 1003,
        name: "Mew",
        positionId: 103,
        positionName: "UI/UX Designer",
      },
    ],
  },

  {
    id: 2,
    name: "Campus Mobile",
    description:
      "Creating a mobile application to make campus life easier for students.",
    category: "Mobile",
    members: 2,
    maxMembers: 4,
    usePositions: true,

    positions: [
      {
        id: 201,
        positionId: "mobile-developer",
        name: "Mobile Developer",
        maxMembers: 2,
      },
      {
        id: 202,
        positionId: "ui-ux-designer",
        name: "UI/UX Designer",
        maxMembers: 1,
      },
      {
        id: 203,
        positionId: "project-manager",
        name: "Project Manager",
        maxMembers: 1,
      },
    ],

    teamMembers: [
      {
        id: 2001,
        name: "Ploy",
        positionId: 201,
        positionName: "Mobile Developer",
      },
      {
        id: 2002,
        name: "June",
        positionId: 202,
        positionName: "UI/UX Designer",
      },
    ],
  },

  {
    id: 3,
    name: "Creative Game Studio",
    description:
      "Looking for teammates to build a small multiplayer game.",
    category: "Game",
    members: 4,
    maxMembers: 5,
    usePositions: true,

    positions: [
      {
        id: 301,
        positionId: "game-developer",
        name: "Game Developer",
        maxMembers: 2,
      },
      {
        id: 302,
        positionId: "game-designer",
        name: "Game Designer",
        maxMembers: 1,
      },
      {
        id: 303,
        positionId: "graphic-designer",
        name: "Graphic Designer",
        maxMembers: 1,
      },
      {
        id: 304,
        positionId: "other",
        name: "Sound Designer",
        maxMembers: 1,
      },
    ],

    teamMembers: [
      {
        id: 3001,
        name: "Max",
        positionId: 301,
        positionName: "Game Developer",
      },
      {
        id: 3002,
        name: "Kim",
        positionId: 302,
        positionName: "Game Designer",
      },
      {
        id: 3003,
        name: "Palm",
        positionId: 301,
        positionName: "Game Developer",
      },
      {
        id: 3004,
        name: "Nina",
        positionId: 303,
        positionName: "Graphic Designer",
      },
    ],
  },

  {
    id: 4,
    name: "AI Research",
    description:
      "Exploring practical applications of machine learning and data analysis.",
    category: "AI",
    members: 2,
    maxMembers: 4,
    usePositions: true,

    positions: [
      {
        id: 401,
        positionId: "machine-learning-engineer",
        name: "Machine Learning Engineer",
        maxMembers: 1,
      },
      {
        id: 402,
        positionId: "data-analyst",
        name: "Data Analyst",
        maxMembers: 2,
      },
      {
        id: 403,
        positionId: "other",
        name: "Researcher",
        maxMembers: 1,
      },
    ],

    teamMembers: [
      {
        id: 4001,
        name: "Tan",
        positionId: 401,
        positionName: "Machine Learning Engineer",
      },
      {
        id: 4002,
        name: "Fah",
        positionId: 402,
        positionName: "Data Analyst",
      },
    ],
  },

  {
    id: 5,
    name: "Student Experience",
    description:
      "Designing a user-friendly experience for a student platform.",
    category: "UI/UX",
    members: 3,
    maxMembers: 5,
    usePositions: true,

    positions: [
      {
        id: 501,
        positionId: "ui-ux-designer",
        name: "UI/UX Designer",
        maxMembers: 2,
      },
      {
        id: 502,
        positionId: "graphic-designer",
        name: "Graphic Designer",
        maxMembers: 1,
      },
      {
        id: 503,
        positionId: "data-analyst",
        name: "Data Analyst",
        maxMembers: 1,
      },
      {
        id: 504,
        positionId: "other",
        name: "UX Researcher",
        maxMembers: 1,
      },
    ],

    teamMembers: [
      {
        id: 5001,
        name: "Mint",
        positionId: 501,
        positionName: "UI/UX Designer",
      },
      {
        id: 5002,
        name: "Fern",
        positionId: 502,
        positionName: "Graphic Designer",
      },
      {
        id: 5003,
        name: "Ice",
        positionId: 504,
        positionName: "UX Researcher",
      },
    ],
  },

  {
    id: 6,
    name: "Backend System",
    description:
      "Building a scalable backend system for a university project.",
    category: "Web",
    members: 2,
    maxMembers: 4,
    usePositions: false,

    positions: [],

    teamMembers: [
      {
        id: 6001,
        name: "Game",
        positionId: null,
        positionName: null,
      },
      {
        id: 6002,
        name: "Boss",
        positionId: null,
        positionName: null,
      },
    ],
  },
];

export default teams;