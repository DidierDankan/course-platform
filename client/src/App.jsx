import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '@view/Landing';
import Register from '@view/auth/Register';
import Login from '@view/auth/Login';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Add protected routes later */}
      </Routes>
    </Router>
  );
}

