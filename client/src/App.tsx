import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import RoomsPage from "@/pages/rooms";
import RoomPage from "@/pages/room";
import CreateRoom from "@/pages/createRoom";
import Instructions from "@/pages/instructions";
import Quick from "@/pages/quick";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<CreateRoom />} path="/create" />
      <Route element={<RoomPage />} path="/room/:roomId" />
      <Route element={<RoomsPage />} path="/rooms" />
      <Route element={<Instructions />} path="/instructions" />
      <Route element={<Quick />} path="/quick" />
    </Routes>
  );
}

export default App;
