import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiUser, FiEdit2, FiTrash2, FiSearch, FiFilter, FiMail, FiPhone } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { useForm } from 'react-hook-form';
import { formatRegistrationNumber, getRoleFromRegistrationNumber } from '../../utils/formatUtils';

const UserManagement = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form hooks
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm();
  const password = watch('password', '');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and search
    if (users.length > 0) {
      let filtered = [...users];
      
      // Apply role filter
      if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role === roleFilter);
      }
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [users, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openCreateUserModal = () => {
    setSelectedUser(null);
    reset({
      name: '',
      registration_number: '',
      email: '',
      mobile_number: '',
      password: '',
      confirm_password: '',
      role: 'student',
      department: '',
      group_id: ''
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setValue('name', user.name || '');
    setValue('registration_number', user.registration_number || '');
    setValue('email', user.email || '');
    setValue('mobile_number', user.mobile_number || '');
    setValue('role', user.role || 'student');
    setValue('department', user.department || '');
    setValue('group_id', user.group_id || '');
    // Don't set password fields when editing
    setValue('password', '');
    setValue('confirm_password', '');
    setShowUserModal(true);
  };

  const handleCreateUser = async (data) => {
    try {
      // Validate registration number format based on role
      const expectedRole = getRoleFromRegistrationNumber(data.registration_number);
      if (expectedRole !== data.role) {
        showError(`Registration number format doesn't match the selected role. Use format: 
          Admin: ADM followed by 3 digits, 
          Faculty: 7 digits, 
          Student: 10 digits`);
        return;
      }
      
      // Create user
      const userData = {
        ...data,
        is_verified: true // Admin-created accounts are pre-verified
      };
      
      const response = await adminService.createUser(userData);
      
      // Add the new user to the list
      setUsers([...users, response.user]);
      
      showSuccess('User created successfully');
      setShowUserModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      showError(error.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (data) => {
    try {
      if (!selectedUser) return;
      
      // Don't update registration number (it's the identifier)
      const { registration_number, ...updateData } = data;
      
      // Remove password fields if empty
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.confirm_password;
      }
      
      await adminService.updateUser(selectedUser._id, updateData);
      
      // Update the user in the list
      const updatedUsers = users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, ...updateData } 
          : user
      );
      
      setUsers(updatedUsers);
      
      showSuccess('User updated successfully');
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating user:', error);
      showError(error.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!selectedUser) return;
      
      await adminService.deleteUser(selectedUser._id);
      
      // Remove the user from the list
      const updatedUsers = users.filter(user => user._id !== selectedUser._id);
      setUsers(updatedUsers);
      
      showSuccess('User deleted successfully');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(error.error || 'Failed to delete user');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        
        <Button 
          onClick={openCreateUserModal}
          icon={<FiUserPlus />}
        >
          Create User
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name, email, or registration number"
            icon={<FiSearch />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <select
            className="input py-2 px-3"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="faculty">Faculty</option>
            <option value="student">Students</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No users match your search criteria.' 
                : roleFilter !== 'all'
                  ? `No ${roleFilter} users found.`
                  : 'No users found in the system.'}
            </p>
            <div className="mt-6">
              <Button 
                onClick={openCreateUserModal}
                icon={<FiUserPlus />}
              >
                Create User
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                      {user.department && (
                        <div className="text-xs text-gray-500">{user.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.registration_number}</div>
                      {user.group_id && (
                        <div className="text-xs text-gray-500">Group: {user.group_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FiMail className="mr-1" size={12} />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.mobile_number && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FiPhone className="mr-1" size={12} />
                          <span>{user.mobile_number}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="outline" 
                        size="sm"
                        icon={<FiEdit2 size={14} />}
                        className="mr-2"
                        onClick={() => openEditUserModal(user)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="error" 
                        size="sm"
                        icon={<FiTrash2 size={14} />}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(selectedUser ? handleUpdateUser : handleCreateUser)}
            >
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(selectedUser ? handleUpdateUser : handleCreateUser)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="name">Full Name</label>
              <input
                id="name"
                className={`input ${errors.name ? 'border-error-500' : ''}`}
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-xs text-error-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="registration_number">Registration Number</label>
              <input
                id="registration_number"
                className={`input ${errors.registration_number ? 'border-error-500' : ''}`}
                type="text"
                {...register('registration_number', { 
                  required: 'Registration number is required',
                  disabled: !!selectedUser // Disable on edit
                })}
                placeholder="Enter registration number"
                readOnly={!!selectedUser}
              />
              {errors.registration_number ? (
                <p className="text-xs text-error-500 mt-1">{errors.registration_number.message}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Admin: ADM followed by 3 digits, Faculty: 7 digits, Student: 10 digits
                </p>
              )}
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                className={`input ${errors.email ? 'border-error-500' : ''}`}
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-xs text-error-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="mobile_number">Mobile Number</label>
              <input
                id="mobile_number"
                className={`input ${errors.mobile_number ? 'border-error-500' : ''}`}
                type="text"
                {...register('mobile_number', { 
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Mobile number must be 10 digits'
                  }
                })}
                placeholder="Enter 10-digit mobile number"
              />
              {errors.mobile_number && (
                <p className="text-xs text-error-500 mt-1">{errors.mobile_number.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="role">Role</label>
              <select
                id="role"
                className={`input ${errors.role ? 'border-error-500' : ''}`}
                {...register('role', { required: 'Role is required' })}
                disabled={!!selectedUser} // Disable on edit
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-error-500 mt-1">{errors.role.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="department">Department (for Faculty)</label>
              <input
                id="department"
                className="input"
                type="text"
                {...register('department')}
                placeholder="Enter department name"
              />
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="group_id">Group ID (for Students)</label>
              <input
                id="group_id"
                className="input"
                type="text"
                {...register('group_id')}
                placeholder="Enter group ID"
              />
            </div>
            
            {/* Only show password fields for new users or explicit password reset */}
            {!selectedUser && (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className={`input ${errors.password ? 'border-error-500' : ''}`}
                    type={showPassword ? "text" : "password"}
                    {...register('password', { 
                      required: !selectedUser ? 'Password is required' : false,
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-xs text-error-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="label" htmlFor="confirm_password">Confirm Password</label>
                  <input
                    id="confirm_password"
                    className={`input ${errors.confirm_password ? 'border-error-500' : ''}`}
                    type={showPassword ? "text" : "password"}
                    {...register('confirm_password', { 
                      required: !selectedUser ? 'Please confirm password' : false,
                      validate: value => !value || value === password || 'Passwords do not match'
                    })}
                    placeholder="Confirm password"
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-error-500 mt-1">{errors.confirm_password.message}</p>
                  )}
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      id="show_password"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                    />
                    <label htmlFor="show_password" className="ml-2 block text-sm text-gray-900">
                      Show password
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete User"
        footer={
          <Modal.Footer.Delete
            onDelete={handleDeleteUser}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the user "{selectedUser?.name}" ({selectedUser?.registration_number})? This action cannot be undone.
        </p>
        
        <div className="mt-4 bg-yellow-50 p-3 rounded-md">
          <p className="text-sm text-yellow-700">
            Warning: Deleting this user will remove all associated data including classes, activities, and meeting requests.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;