import { Link, useParams } from "react-router-dom";

import teams from "../data/teams";

function TeamDetail() {
  const { id } = useParams();

  const team = teams.find(
    (item) => item.id === Number(id)
  );

  if (!team) {
    return (
      <div className="min-h-screen bg-surface">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-xl border border-border bg-background px-6 py-16 text-center">
            <h1 className="text-xl font-semibold text-text">
              Team not found
            </h1>

            <p className="mt-2 text-sm text-text-muted">
              The team you are looking for does not exist.
            </p>

            <Link
              to="/teams"
              className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              Back to Teams
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Back */}

        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-text"
        >
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
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>

          Back to Teams
        </Link>


        {/* Team Header */}

        <section className="mt-8 rounded-xl border border-border bg-background p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

            <div>
              <span className="inline-flex rounded-md bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                {team.category}
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-text">
                {team.name}
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-text-muted">
                {team.description}
              </p>
            </div>


            {/* Member Count */}

            <div className="shrink-0 rounded-lg bg-surface px-5 py-4 text-center">
              <p className="text-2xl font-bold text-text">
                {team.members}/{team.maxMembers}
              </p>

              <p className="mt-1 text-xs text-text-muted">
                Members
              </p>
            </div>

          </div>


          {/* Skills */}

          <div className="mt-8 border-t border-border pt-6">

            <h2 className="text-sm font-semibold text-text">
              Skills Needed
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {team.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>

          </div>

        </section>


        {/* Main Content */}

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* About */}

          <section className="rounded-xl border border-border bg-background p-6 md:col-span-2">

            <h2 className="text-lg font-semibold text-text">
              About this team
            </h2>

            <p className="mt-4 leading-7 text-text-muted">
              This team is looking for students who are
              interested in working together on a university
              project. Members can collaborate, share
              responsibilities, and build the project together.
            </p>

          </section>


          {/* Join */}

          <section className="rounded-xl border border-border bg-background p-6">

            <h2 className="text-lg font-semibold text-text">
              Interested?
            </h2>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              Send a request to join this team.
            </p>

            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              Request to Join
            </button>

          </section>

        </div>


        {/* Team Members */}

        <section className="mt-6 rounded-xl border border-border bg-background p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-text">
                Team Members
              </h2>

              <p className="mt-1 text-sm text-text-muted">
                {team.members} of {team.maxMembers} members
              </p>
            </div>

          </div>


          <div className="mt-6 divide-y divide-border">

            {team.teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >

                {/* Avatar */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                  {member.name.charAt(0)}
                </div>


                {/* Information */}

                <div>
                  <p className="text-sm font-semibold text-text">
                    {member.name}
                  </p>

                  <p className="mt-1 text-sm text-text-muted">
                    {member.role}
                  </p>
                </div>

              </div>
            ))}

          </div>

        </section>

      </main>
    </div>
  );
}

export default TeamDetail;