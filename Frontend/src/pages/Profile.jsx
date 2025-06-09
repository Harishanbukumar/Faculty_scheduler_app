import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiBook, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiService from '../services/apiService';

const Profile = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile_number: '',
    department: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    showPassword: false
  });
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUserDetails();
    }
  }, [currentUser]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      // Get detailed user information
      let url;
      switch (currentUser.role) {
        case 'admin':
          url = `/admin/users/${currentUser.id}`;
          break;
        case 'faculty':
          url = `/faculty/profile`;
          break;
        case 'student':
          url = `/student/profile`;
          break;
        default:
          url = `/auth/profile`;
      }

      const response = await apiService.get(url);
      const userData = response.user || currentUser;
      
      setUserDetails(userData);
      setProfileForm({
        name: userData.name || '',
        email: userData.email || '',
        mobile_number: userData.mobile_number || '',
        department: userData.department || '',
        bio: userData.bio || ''
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to current user info from auth context
      setUserDetails(currentUser);
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        mobile_number: currentUser.mobile_number || '',
        department: currentUser.department || '',
        bio: currentUser.bio || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      let url;
      switch (currentUser.role) {
        case 'admin':
          url = `/admin/users/${currentUser.id}`;
          break;
        case 'faculty':
          url = `/faculty/profile`;
          break;
        case 'student':
          url = `/student/profile`;
          break;
        default:
          url = `/auth/profile`;
      }

      await apiService.put(url, profileForm);
      
      // Update local state
      setUserDetails({
        ...userDetails,
        ...profileForm
      });
      
      setEditMode(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        showError('Passwords do not match');
        return;
      }

      if (passwordForm.new_password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
      }

      await apiService.put('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      // Reset form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
        showPassword: false
      });
      
      setChangePassword(false);
      showSuccess('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showError(error.error || 'Failed to change password');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'faculty':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-4xl font-bold">
              {userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-gray-800">{userDetails?.name || 'User'}</h2>
            
            <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(userDetails?.role)}`}>
              {userDetails?.role?.charAt(0).toUpperCase() + userDetails?.role?.slice(1) || 'User'}
            </span>
            
            <div className="mt-6 w-full">
              <div className="flex items-center text-gray-600 py-2">
                <FiUser className="w-5 h-5 mr-3" />
                <span>{userDetails?.registration_number || 'N/A'}</span>
              </div>
              
              {userDetails?.email && (
                <div className="flex items-center text-gray-600 py-2">
                  <FiMail className="w-5 h-5 mr-3" />
                  <span>{userDetails.email}</span>
                </div>
              )}
              
              {userDetails?.mobile_number && (
                <div className="flex items-center text-gray-600 py-2">
                  <FiPhone className="w-5 h-5 mr-3" />
                  <span>{userDetails.mobile_number}</span>
                </div>
              )}
              
              {userDetails?.department && (
                <div className="flex items-center text-gray-600 py-2">
                  <FiBook className="w-5 h-5 mr-3" />
                  <span>{userDetails.department}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 w-full">
              <Button
                fullWidth
                variant="outline"
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Profile Details Card */}
        <Card 
          title={editMode ? "Edit Profile" : "Profile Details"}
          className="lg:col-span-2"
          footer={
            editMode ? (
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset form to original values
                    setProfileForm({
                      name: userDetails?.name || '',
                      email: userDetails?.email || '',
                      mobile_number: userDetails?.mobile_number || '',
                      department: userDetails?.department || '',
                      bio: userDetails?.bio || ''
                    });
                    setEditMode(false);
                  }}
                  icon={<FiX />}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateProfile}
                  icon={<FiSave />}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setEditMode(true)}
                icon={<FiEdit2 />}
              >
                Edit Profile
              </Button>
            )
          }
        >
          {editMode ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Email Address"
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Enter your email address"
              />
              
              <Input
                label="Mobile Number"
                id="mobile_number"
                value={profileForm.mobile_number}
                onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                placeholder="Enter your mobile number"
              />
              
              {currentUser?.role === 'faculty' && (
                <Input
                  label="Department"
                  id="department"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  placeholder="Enter your department"
                />
              )}
              
              <div className="form-group">
                <label className="label" htmlFor="bio">Bio / About Me</label>
                <textarea
                  id="bio"
                  className="input h-24"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-base text-gray-900">{userDetails?.name || 'Not provided'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                <p className="mt-1 text-base text-gray-900">{userDetails?.email || 'Not provided'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                <p className="mt-1 text-base text-gray-900">{userDetails?.mobile_number || 'Not provided'}</p>
              </div>
              
              {userDetails?.department && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="mt-1 text-base text-gray-900">{userDetails.department}</p>
                </div>
              )}
              
              {userDetails?.group_id && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Group</h3>
                  <p className="mt-1 text-base text-gray-900">{userDetails.group_id}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bio / About Me</h3>
                <p className="mt-1 text-base text-gray-900">{userDetails?.bio || 'No bio provided'}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Change Password Modal */}
      {changePassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
              <button
                onClick={() => setChangePassword(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-full p-1"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Current Password"
                id="current_password"
                type={passwordForm.showPassword ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Enter your current password"
                required
              />
              
              <Input
                label="New Password"
                id="new_password"
                type={passwordForm.showPassword ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Enter new password"
                required
                helperText="Password must be at least 8 characters long"
              />
              
              <Input
                label="Confirm New Password"
                id="confirm_password"
                type={passwordForm.showPassword ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Confirm your new password"
                required
                error={
                  passwordForm.confirm_password && 
                  passwordForm.new_password !== passwordForm.confirm_password ? 
                  "Passwords don't match" : null
                }
              />
              
              <div className="flex items-center mt-2">
                <input
                  id="show_password"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={passwordForm.showPassword}
                  onChange={() => setPasswordForm({ ...passwordForm, showPassword: !passwordForm.showPassword })}
                />
                <label htmlFor="show_password" className="ml-2 block text-sm text-gray-900">
                  Show password
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setChangePassword(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={
                  !passwordForm.current_password ||
                  !passwordForm.new_password ||
                  !passwordForm.confirm_password ||
                  passwordForm.new_password !== passwordForm.confirm_password ||
                  passwordForm.new_password.length < 8
                }
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;