import { useMemo, useState } from "react";

import SearchBar from "../components/SearchBar";
import TeamCard from "../components/TeamCard";

import teams from "../data/teams";

function Teams() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = [
    "All",
    "Web",
    "Mobile",
    "Game",
    "AI",
    "Design",
  ];

  const filteredTeams = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return teams.filter((team) => {
      const matchesCategory =
        category === "All" || team.category === category;

      const matchesSearch =
        keyword === "" ||
        team.name.toLowerCase().includes(keyword) ||
        team.description.toLowerCase().includes(keyword) ||
        team.skills.some((skill) =>
          skill.toLowerCase().includes(keyword)
        );

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-surface">

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-text">
              Find Teams
            </h1>

            <p className="mt-3 text-text-muted">
              Discover teams looking for people to build
              something together.
            </p>
          </div>

          <div className="mt-8 max-w-3xl">
            <SearchBar
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  category === item
                    ? "bg-primary text-white"
                    : "border border-border bg-background text-text-muted hover:bg-surface"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

        </div>
      </section>


      <main className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {filteredTeams.length}{" "}
            {filteredTeams.length === 1 ? "team" : "teams"} found
          </p>
        </div>


        {filteredTeams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-text">
              No teams found
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Try changing your search or category.
            </p>
          </div>
        )}

      </main>

    </div>
  );
}

export default Teams;