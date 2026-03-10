import { BrowserRouter, Routes, Route } from "react-router-dom";

import WornNumbers from "./pages/WornNumbers";
import BostonWall  from "./pages/BostonWall";
import About       from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<WornNumbers />} />
        <Route path="/boston" element={<BostonWall />} />
        <Route path="/about"  element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
