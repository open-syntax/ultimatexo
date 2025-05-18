import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import RoomsPage from "@/pages/rooms";
import RoomPage from "@/pages/room";
import CreateRoom from "@/pages/createRoom";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<CreateRoom />} path="/create" />
      <Route element={<RoomPage />} path="/room/:roomId" />
      <Route element={<RoomsPage />} path="/rooms" />
    </Routes>
  );
}

export default App;
