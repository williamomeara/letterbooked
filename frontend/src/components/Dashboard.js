import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Please login.</p>;

  return (
    <div>
      <h1>Welcome to Letterbooked, {user.username}!</h1>
      <div className="row">
        <div className="col-md-6">
          <h3>Your Stats</h3>
          <p>Books Read: 0</p> {/* TODO: Fetch from API */}
          <p>Average Rating: 0</p>
        </div>
        <div className="col-md-6">
          <h3>Recent Activity</h3>
          <p>No recent activity.</p> {/* TODO: Fetch activities */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;