import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import HomePage from './HomePage'
import PostsPage from './PostsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/homepage" element={<HomePage/>}/>
        <Route path="/posts" element={<PostsPage />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
