import { Navigate } from 'react-router-dom';

// Settings now redirects to Profile page (account settings)
const StudioSettings = () => <Navigate to="/dashboard/profile" replace />;
export default StudioSettings;
