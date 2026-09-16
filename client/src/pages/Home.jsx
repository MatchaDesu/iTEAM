import { Link } from "react-router-dom";

function Home() {
  return (
    <div>

      {/* ========================================
          Hero
      ======================================== */}

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">

          <div className="mx-auto max-w-4xl text-center">

            <span className="inline-flex rounded-full bg-primary-light px-4 py-2 text-sm font-medium text-primary">
              Find people. Build together.
            </span>

            <h1 className="mt-8 text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
              Find the right team.
              <br />
              Build something together.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-muted">
              iTEAM helps you find teammates based on their
              skills, interests, and the projects they want to build.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                to="/explore"
                className="rounded-lg bg-primary px-6 py-3.5 font-medium text-white transition hover:bg-primary-hover"
              >
                Find Teammates
              </Link>

              <Link
                to="/team"
                className="rounded-lg border border-border bg-background px-6 py-3.5 font-medium text-text transition hover:bg-surface"
              >
                Create a Team
              </Link>

            </div>

          </div>

        </div>
      </section>


      {/* ========================================
          Features
      ======================================== */}

      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="mx-auto max-w-2xl text-center">

            <h2 className="text-3xl font-bold tracking-tight text-text">
              Everything you need to find a team
            </h2>

            <p className="mt-4 text-text-muted">
              Whether you're looking for people or starting
              your own project, iTEAM makes it easier to connect.
            </p>

          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-3">

            {/* Feature 1 */}

            <div className="rounded-xl border border-border bg-background p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.125-.956 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-text">
                Find teammates
              </h3>

              <p className="mt-2 leading-6 text-text-muted">
                Discover people based on their skills,
                interests, and availability.
              </p>

            </div>


            {/* Feature 2 */}

            <div className="rounded-xl border border-border bg-background p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 7.5h16.5M3.75 12h16.5m-16.5 4.5h16.5"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-text">
                Discover projects
              </h3>

              <p className="mt-2 leading-6 text-text-muted">
                Explore teams that are looking for new
                members and find projects that interest you.
              </p>

            </div>


            {/* Feature 3 */}

            <div className="rounded-xl border border-border bg-background p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-text">
                Build your team
              </h3>

              <p className="mt-2 leading-6 text-text-muted">
                Create your own team, define what you need,
                and invite the right people to join.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* ========================================
          CTA
      ======================================== */}

      <section>
        <div className="mx-auto max-w-7xl px-6 py-24">

          <div className="rounded-2xl bg-primary px-8 py-16 text-center sm:px-12">

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to find your team?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Find people who share your interests and
              start building something together.
            </p>

            <Link
              to="/explore"
              className="mt-8 inline-flex rounded-lg bg-white px-6 py-3.5 font-medium text-primary transition hover:bg-primary-light"
            >
              Get Started
            </Link>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;