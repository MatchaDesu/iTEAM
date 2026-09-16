import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Select from "../components/Select";
import categories from "../data/categories";
import positions from "../data/positions";

const maxMemberOptions = Array.from(
  { length: 19 },
  (_, index) => ({
    value: String(index + 2),
    label: `${index + 2} members`,
  })
);

const positionMemberOptions = [
  ...Array.from(
    { length: 10 },
    (_, index) => ({
      value: String(index + 1),
      label: `${index + 1} ${
        index === 0 ? "person" : "people"
      }`,
    })
  ),
  {
    value: "unlimited",
    label: "Unlimited",
  },
];

function CreateTeam() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    maxMembers: "",
    usePositions: false,
    ownPositionId: "",
    ownPositionOther: "",
  });

  const [teamPositions, setTeamPositions] = useState([]);

  const [error, setError] = useState("");

  const finitePositionTotal = useMemo(() => {
    return teamPositions.reduce((total, position) => {
      if (position.maxMembers === "unlimited") {
        return total;
      }

      return total + Number(position.maxMembers);
    }, 0);
  }, [teamPositions]);

  const hasUnlimitedPosition = teamPositions.some(
    (position) => position.maxMembers === "unlimited"
  );

  const maxMembersNumber = Number(form.maxMembers);

  const remainingMembers = Math.max(
    maxMembersNumber - finitePositionTotal,
    0
  );

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  const handlePositionChange = (id, field, value) => {
    setTeamPositions((current) =>
      current.map((position) =>
        position.id === id
          ? {
              ...position,
              [field]: value,
              ...(field === "positionId" && value !== "other"
                ? { otherName: "" }
                : {}),
            }
          : position
      )
    );

    setError("");
  };

  const addPosition = () => {
    setTeamPositions((current) => [
      ...current,
      {
        id: Date.now(),
        positionId: "",
        otherName: "",
        maxMembers: "",
      },
    ]);

    setError("");
  };

  const removePosition = (id) => {
    setTeamPositions((current) =>
      current.filter((position) => position.id !== id)
    );

    if (form.ownPositionId === String(id)) {
      setForm((current) => ({
        ...current,
        ownPositionId: "",
        ownPositionOther: "",
      }));
    }

    setError("");
  };

  const handleUsePositionsChange = (value) => {
    const usePositions = value === "yes";

    setForm((current) => ({
      ...current,
      usePositions,
      ownPositionId: "",
      ownPositionOther: "",
    }));

    if (!usePositions) {
      setTeamPositions([]);
    }

    setError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter a team name.";
    }

    if (!form.description.trim()) {
      return "Please enter a team description.";
    }

    if (!form.category) {
      return "Please select a category.";
    }

    if (!form.maxMembers) {
      return "Please select the maximum number of members.";
    }

    if (!form.usePositions) {
      return "";
    }

    if (teamPositions.length === 0) {
      return "Please add at least one position.";
    }

    for (const position of teamPositions) {
      if (!position.positionId) {
        return "Please select a position for every position slot.";
      }

      if (
        position.positionId === "other" &&
        !position.otherName.trim()
      ) {
        return "Please enter the name for the custom position.";
      }

      if (!position.maxMembers) {
        return "Please select how many people are needed for every position.";
      }
    }

    if (!form.ownPositionId) {
      return "Please select your position in the team.";
    }

    if (
      form.ownPositionId === "other" &&
      !form.ownPositionOther.trim()
    ) {
      return "Please enter your custom position.";
    }

    if (finitePositionTotal > maxMembersNumber) {
      return "The total number of people assigned to positions cannot exceed the team size.";
    }

    if (!hasUnlimitedPosition && finitePositionTotal !== maxMembersNumber) {
      return `Position capacity must equal ${maxMembersNumber} members.`;
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const formattedPositions = teamPositions.map(
      (position) => ({
        id: position.id,
        positionId: position.positionId,
        name:
          position.positionId === "other"
            ? position.otherName.trim()
            : positions.find(
                (item) => item.value === position.positionId
              )?.label,
        maxMembers:
          position.maxMembers === "unlimited"
            ? null
            : Number(position.maxMembers),
      })
    );

    const ownPosition = teamPositions.find(
      (position) =>
        String(position.id) === String(form.ownPositionId)
    );

    const team = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      members: 1,
      maxMembers: maxMembersNumber,

      usePositions: form.usePositions,

      positions: form.usePositions
        ? formattedPositions
        : [],

      teamMembers: [
        {
          id: Date.now() + 1,
          name: "You",
          positionId: ownPosition
            ? ownPosition.id
            : null,
          positionName: ownPosition
            ? ownPosition.positionId === "other"
              ? ownPosition.otherName.trim()
              : positions.find(
                  (item) =>
                    item.value === ownPosition.positionId
                )?.label
            : null,
        },
      ],
    };

    console.log("Created team:", team);

    navigate("/teams");
  };

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto max-w-4xl px-6 py-10">
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
              d="M15.75 19.5 8.25 12l7.5-7.5 7.5"
            />
          </svg>

          Back to Teams
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-text">
            Create Team
          </h1>

          <p className="mt-2 text-text-muted">
            Create a team and find the right people to work
            with.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <section className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold text-text">
              Team Information
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-text">
                  Team Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Campus Connect"
                  className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe what your team is working on..."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm leading-6 text-text outline-none transition placeholder:text-text-muted focus:border-primary"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(value) =>
                    updateForm("category", value)
                  }
                  options={categories}
                  placeholder="Select category"
                  required
                />

                <Select
                  label="Maximum Members"
                  value={form.maxMembers}
                  onChange={(value) =>
                    updateForm("maxMembers", value)
                  }
                  options={maxMemberOptions}
                  placeholder="Select team size"
                  required
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-background p-6">
            <div>
              <h2 className="text-lg font-semibold text-text">
                Position System
              </h2>

              <p className="mt-1 text-sm leading-6 text-text-muted">
                Choose whether members must join a specific
                position in your team.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  handleUsePositionsChange("no")
                }
                className={`rounded-lg border p-4 text-left transition ${
                  !form.usePositions
                    ? "border-primary bg-primary-light"
                    : "border-border hover:bg-surface"
                }`}
              >
                <p className="text-sm font-semibold text-text">
                  No position system
                </p>

                <p className="mt-1 text-sm text-text-muted">
                  Members can join the team normally.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUsePositionsChange("yes")
                }
                className={`rounded-lg border p-4 text-left transition ${
                  form.usePositions
                    ? "border-primary bg-primary-light"
                    : "border-border hover:bg-surface"
                }`}
              >
                <p className="text-sm font-semibold text-text">
                  Use positions
                </p>

                <p className="mt-1 text-sm text-text-muted">
                  Members must request an available
                  position.
                </p>
              </button>
            </div>
          </section>

          {form.usePositions && (
            <section className="rounded-xl border border-border bg-background p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    Team Positions
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    Define which positions your team needs
                    and how many people each position can
                    have.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPosition}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-surface"
                >
                  + Add Position
                </button>
              </div>

              {teamPositions.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-10 text-center">
                  <p className="text-sm font-medium text-text">
                    No positions added
                  </p>

                  <p className="mt-1 text-sm text-text-muted">
                    Add at least one position for your
                    team.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {teamPositions.map(
                    (position, index) => (
                      <div
                        key={position.id}
                        className="rounded-lg border border-border bg-surface p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-text">
                            Position {index + 1}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removePosition(
                                position.id
                              )
                            }
                            className="text-sm font-medium text-danger transition hover:opacity-80"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <Select
                            label="Position"
                            value={
                              position.positionId
                            }
                            onChange={(value) =>
                              handlePositionChange(
                                position.id,
                                "positionId",
                                value
                              )
                            }
                            options={positions}
                            placeholder="Select position"
                            required
                          />

                          <Select
                            label="People Needed"
                            value={
                              position.maxMembers
                            }
                            onChange={(value) =>
                              handlePositionChange(
                                position.id,
                                "maxMembers",
                                value
                              )
                            }
                            options={
                              positionMemberOptions
                            }
                            placeholder="Select number"
                            required
                          />
                        </div>

                        {position.positionId ===
                          "other" && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-text">
                              Custom Position Name
                            </label>

                            <input
                              type="text"
                              value={
                                position.otherName
                              }
                              onChange={(event) =>
                                handlePositionChange(
                                  position.id,
                                  "otherName",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Content Creator"
                              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-primary"
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {teamPositions.length > 0 &&
                form.maxMembers && (
                  <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">
                        Position capacity
                      </span>

                      <span className="font-medium text-text">
                        {finitePositionTotal} /{" "}
                        {maxMembersNumber}
                      </span>
                    </div>

                    {hasUnlimitedPosition && (
                      <p className="mt-2 text-xs text-text-muted">
                        Unlimited positions can accept
                        members up to the overall team
                        capacity.
                      </p>
                    )}

                    {!hasUnlimitedPosition &&
                      finitePositionTotal >
                        maxMembersNumber && (
                        <p className="mt-2 text-xs text-danger">
                          Position capacity exceeds
                          the maximum team size.
                        </p>
                      )}

                    {!hasUnlimitedPosition &&
                      finitePositionTotal <
                        maxMembersNumber && (
                        <p className="mt-2 text-xs text-warning">
                          Add more position capacity to
                          reach {maxMembersNumber} members.
                        </p>
                      )}

                    {hasUnlimitedPosition &&
                      remainingMembers > 0 && (
                        <p className="mt-2 text-xs text-text-muted">
                          {remainingMembers} member slot
                          {remainingMembers !== 1
                            ? "s"
                            : ""}{" "}
                          remain within the team limit.
                        </p>
                      )}
                  </div>
                )}
            </section>
          )}

          {form.usePositions && (
            <section className="rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold text-text">
                Your Position
              </h2>

              <p className="mt-1 text-sm leading-6 text-text-muted">
                Since you are creating this team, you must
                select the position you will take.
              </p>

              <div className="mt-5">
                <Select
                  label="Your Position"
                  value={form.ownPositionId}
                  onChange={(value) =>
                    updateForm(
                      "ownPositionId",
                      value
                    )
                  }
                  options={teamPositions.map(
                    (position) => {
                      const standardPosition =
                        positions.find(
                          (item) =>
                            item.value ===
                            position.positionId
                        );

                      return {
                        value: String(
                          position.id
                        ),
                        label:
                          position.positionId ===
                          "other"
                            ? position.otherName ||
                              "Other"
                            : standardPosition
                              ?.label ||
                              "Select position",
                      };
                    }
                  )}
                  placeholder="Select your position"
                  required
                  disabled={
                    teamPositions.length === 0
                  }
                />
              </div>

              <p className="mt-3 text-xs text-text-muted">
                Your position will count as one member of
                the selected position.
              </p>
            </section>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
              <p className="text-sm text-danger">
                {error}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/teams"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text transition hover:bg-surface"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              Create Team
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateTeam;