const teams = [
  {
    id: 1,
    name: "Web Development",
    description:
      "Building a modern web application for university students.",
    category: "Web",
    skills: ["React", "Node.js", "UI/UX"],
    members: 3,
    maxMembers: 5,

    teamMembers: [
      {
        id: 101,
        name: "Alex",
        role: "Frontend Developer",
      },
      {
        id: 102,
        name: "Beam",
        role: "Backend Developer",
      },
      {
        id: 103,
        name: "Mew",
        role: "UI/UX Designer",
      },
    ],
  },

  {
    id: 2,
    name: "Mobile App",
    description:
      "Creating a mobile application to make campus life easier.",
    category: "Mobile",
    skills: ["Flutter", "UI/UX", "Firebase"],
    members: 2,
    maxMembers: 4,

    teamMembers: [
      {
        id: 201,
        name: "Ploy",
        role: "Mobile Developer",
      },
      {
        id: 202,
        name: "June",
        role: "UI/UX Designer",
      },
    ],
  },

  {
    id: 3,
    name: "Game Development",
    description:
      "Looking for teammates to build a small multiplayer game.",
    category: "Game",
    skills: ["Unity", "C#", "Game Design"],
    members: 4,
    maxMembers: 5,

    teamMembers: [
      {
        id: 301,
        name: "Max",
        role: "Game Developer",
      },
      {
        id: 302,
        name: "Kim",
        role: "Game Designer",
      },
      {
        id: 303,
        name: "Palm",
        role: "Programmer",
      },
      {
        id: 304,
        name: "Nina",
        role: "Artist",
      },
    ],
  },

  {
    id: 4,
    name: "AI Research",
    description:
      "Exploring practical applications of machine learning.",
    category: "AI",
    skills: ["Python", "Machine Learning", "Data"],
    members: 2,
    maxMembers: 4,

    teamMembers: [
      {
        id: 401,
        name: "Tan",
        role: "Machine Learning",
      },
      {
        id: 402,
        name: "Fah",
        role: "Data Analyst",
      },
    ],
  },

  {
    id: 5,
    name: "UI/UX Project",
    description:
      "Designing a user-friendly experience for a student platform.",
    category: "Design",
    skills: ["Figma", "UI/UX", "Research"],
    members: 3,
    maxMembers: 5,

    teamMembers: [
      {
        id: 501,
        name: "Mint",
        role: "UX Designer",
      },
      {
        id: 502,
        name: "Fern",
        role: "UI Designer",
      },
      {
        id: 503,
        name: "Ice",
        role: "UX Researcher",
      },
    ],
  },

  {
    id: 6,
    name: "Backend System",
    description:
      "Building a scalable backend system for a university project.",
    category: "Web",
    skills: ["Express", "PostgreSQL", "API"],
    members: 2,
    maxMembers: 4,

    teamMembers: [
      {
        id: 601,
        name: "Game",
        role: "Backend Developer",
      },
      {
        id: 602,
        name: "Boss",
        role: "Database Developer",
      },
    ],
  },
];

export default teams;