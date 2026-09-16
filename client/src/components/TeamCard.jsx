import { Link } from "react-router-dom";

function TeamCard({ team }) {
  return (
    <article className="rounded-xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm">

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-md bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
            {team.category}
          </span>

          <h2 className="mt-4 text-lg font-semibold text-text">
            {team.name}
          </h2>
        </div>
      </div>

      <p className="mt-2 min-h-12 text-sm leading-6 text-text-muted">
        {team.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {team.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">

        <div className="flex items-center gap-2 text-sm text-text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
            />
          </svg>

          {team.members} / {team.maxMembers} members
        </div>

        <Link
          to={`/teams/${team.id}`}
          className="text-sm font-medium text-primary transition hover:text-primary-hover"
        >
          View Team →
        </Link>

      </div>
    </article>
  );
}

export default TeamCard;