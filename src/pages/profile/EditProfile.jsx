import { UserProfile } from '@clerk/clerk-react';
import './editProfile.css';

function EditProfile() {
  return (
    <div className="edit-profile-container">
      <div className="edit-profile-wrapper">
        <UserProfile />
      </div>
    </div>
  );
}

export default EditProfile;
