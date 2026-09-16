import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  const toggleProfile = () => {
    setProfileOpen((current) => !current);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center px-6">

        {/* Logo */}

        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-text"
        >
          iTEAM
        </Link>


        {/* Main Navigation */}

        <div className="ml-10 flex items-center gap-1">

          <Link
            to="/teams"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-text"
          >
            Find Teams
          </Link>

          <Link
            to="/people"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-text"
          >
            Find People
          </Link>

          <Link
            to="/my-teams"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-text"
          >
            My Teams
          </Link>

        </div>


        {/* Right Side */}

        <div className="ml-auto flex items-center gap-2">

          {/* Create Team */}

          <Link
            to="/create-team"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Create Team
          </Link>


          {/* Theme Toggle */}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition hover:bg-surface hover:text-text"
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="4"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                />
              </svg>
            )}
          </button>


          {/* Profile */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={toggleProfile}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition hover:bg-surface-hover hover:text-text"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                />
              </svg>
            </button>


            {/* Dropdown */}

            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-background p-1.5 shadow-lg">

                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-text transition hover:bg-surface"
                >
                  Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-text transition hover:bg-surface"
                >
                  Settings
                </Link>

                <div className="my-1 border-t border-border" />

                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-surface"
                >
                  Sign Out
                </button>

              </div>
            )}
          </div>

        </div>

      </nav>
    </header>
  );
}

export default Navbar;