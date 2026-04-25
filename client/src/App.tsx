import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Spinner } from "@heroui/spinner";

import { BackgroundEffects } from "@/components/background-effects";

const IndexPage = lazy(() => import("@/pages/index"));
const RoomsPage = lazy(() => import("@/pages/rooms"));
const RoomPage = lazy(() => import("@/pages/room"));
const CreateRoom = lazy(() => import("@/pages/createRoom"));
const Instructions = lazy(() => import("@/pages/instructions"));
const Quick = lazy(() => import("@/pages/quick"));

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <>
      <BackgroundEffects />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<IndexPage />} path="/" />
          <Route element={<CreateRoom />} path="/create" />
          <Route element={<RoomPage />} path="/room/:roomId" />
          <Route element={<RoomsPage />} path="/rooms" />
          <Route element={<Instructions />} path="/instructions" />
          <Route element={<Quick />} path="/quick" />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
