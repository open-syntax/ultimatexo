import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import RoomsPage from "@/pages/rooms";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<RoomsPage />} path="/rooms" />
    </Routes>
  );
}

export default App;
