import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chatbot from "./components/Chatbot";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Menu from "./pages/Menu";
import Beneficiarios from "./pages/Beneficiarios";
import Noticias from "./pages/Noticias";
import Reserva from "./pages/Reserva";
import Contacto from "./pages/Contacto";
import Admin from "./pages/Admin";
import Reportes from "./pages/Reportes";
import Estadisticas from "./pages/Estadisticas";
import NoEncontrado from "./pages/NoEncontrado";

function App() {
  return (
    <BrowserRouter basename="/pae">
      <div className="app-layout">
        <Sidebar />
        <main className="contenido">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/beneficiarios" element={<Beneficiarios />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/reserva" element={<Reserva />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </main>
      </div>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
