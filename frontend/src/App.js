import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }          from './context/AuthContext';
import Home                 from './pages/Home';
import Login                from './pages/Login';
import Register             from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import FindDonors           from './pages/FindDonors';
import Requests             from './pages/Requests';
import Notifications        from './pages/Notifications';
import DonorDashboard       from './pages/DonorDashboard';
import ReceiverDashboard    from './pages/ReceiverDashboard';
import AdminDashboard       from './pages/AdminDashboard';
import Chat                 from './pages/Chat';
import Blog                 from './pages/Blog';
import Health               from './pages/Health';
import HealthHistory        from './pages/HealthHistory';
import Leaderboard          from './pages/Leaderboard';
import AcceptedRequests from './pages/AcceptedRequests';
import Bookmarks from './pages/Bookmarks';
import DonorProfile from './pages/DonorProfile';
import Certificate from './pages/Certificate';
import 'leaflet/dist/leaflet.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to='/login' />;
  if (roles && !roles.includes(user.role)) return <Navigate to='/' />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path='/'                 element={<Home />} />
        <Route path='/login'            element={<Login />} />
        <Route path='/register'         element={<Register />} />
        <Route path='/donors'           element={<FindDonors />} />
        <Route path='/requests'         element={<Requests />} />
        <Route path='/blog'             element={<Blog />} />
        <Route path='/leaderboard'      element={<Leaderboard />} />
        <Route path='/health-reminders' element={<Health />} />
        <Route path='/donor/:donorId' element={<DonorProfile />} />

        {/* Protected — Login Required */}
        <Route path='/health-history' element={
          <ProtectedRoute>
            <HealthHistory />
          </ProtectedRoute>
        } />

        <Route path='/forgot-password' element={<ForgotPassword />} />
        
        <Route path='/notifications' element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path='/chat' element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

<Route path='/certificate' element={
  <ProtectedRoute roles={['donor']}>
    <Certificate />
  </ProtectedRoute>
} />

        {/* Protected — Donor */}
        <Route path='/donor/dashboard' element={
          <ProtectedRoute roles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        } />
        // Add route
       <Route path='/accepted-requests' element={
        <ProtectedRoute>
         <AcceptedRequests />
        </ProtectedRoute>
        } />
        
        {/* Protected — Receiver */}
        <Route path='/receiver/dashboard' element={
          <ProtectedRoute roles={['receiver']}>
            <ReceiverDashboard />
          </ProtectedRoute>
        } />
        
        // Add inside Routes:
<Route path='/bookmarks' element={
  <ProtectedRoute roles={['receiver']}>
    <Bookmarks />
  </ProtectedRoute>
} />

        {/* Protected — Admin */}
        <Route path='/admin/dashboard' element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;