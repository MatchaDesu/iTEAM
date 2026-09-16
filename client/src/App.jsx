import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import CreateTeam from "./pages/CreateTeam";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/teams"
            element={<Teams />}
          />

          <Route
            path="/teams/:id"
            element={<TeamDetail />}
          />

          <Route
            path="/create-team"
            element={<CreateTeam />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;