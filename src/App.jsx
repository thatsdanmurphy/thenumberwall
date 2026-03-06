import { BrowserRouter, Routes, Route } from "react-router-dom";

import WornNumbers from "./pages/WornNumbers";
import BostonWall from "./pages/BostonWall";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WornNumbers />} />
        <Route path="/boston" element={<BostonWall />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;