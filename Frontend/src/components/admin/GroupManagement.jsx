import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiUserCheck, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import Layout from '../../components/common/Layout';

const GroupManagement = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    group_id: ''
  });

  useEffect(() => {
    fetchGroups();
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    if (students.length > 0 && searchTerm) {
      const filtered = students.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, searchTerm]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would come from an API
      // For now, we'll use mock data
      const mockGroups = [
        { 
          id: 'CS2023A', 
          name: 'Computer Science 2023 A',
          description: 'First year computer science students (Group A)',
          student_count: 35
        },
        { 
          id: 'CS2023B', 
          name: 'Computer Science 2023 B',
          description: 'First year computer science students (Group B)',
          student_count: 32
        },
        { 
          id: 'EC2022', 
          name: 'Electronics 2022',
          description: 'Second year electronics engineering students',
          student_count: 45
        },
        { 
          id: 'ME2021', 
          name: 'Mechanical 2021',
          description: 'Third year mechanical engineering students',
          student_count: 38
        }
      ];
      
      setGroups(mockGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await adminService.getUsers('student');
      setStudents(response.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      showError('Failed to load students');
    }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      if (!groupId) return;
      
      // In a real implementation, this would come from groupService.getGroupStudents(groupId)
      // For now, we'll filter from the current students list
      return students.filter(student => student.group_id === groupId);
    } catch (error) {
      console.error('Error fetching group students:', error);
      showError('Failed to load group students');
      return [];
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupForm.name || !groupForm.group_id) {
        showError('Group name and ID are required');
        return;
      }
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate adding to the list
      const newGroup = {
        id: groupForm.group_id,
        name: groupForm.name,
        description: groupForm.description,
        student_count: 0
      };
      
      setGroups([...groups, newGroup]);
      
      showSuccess('Group created successfully');
      setShowGroupModal(false);
      
      // Reset form
      setGroupForm({
        name: '',
        description: '',
        group_id: ''
      });
    } catch (error) {
      console.error('Error creating group:', error);
      showError('Failed to create group');
    }
  };

  const handleEditGroup = async () => {
    try {
      if (!selectedGroup || !groupForm.name || !groupForm.group_id) {
        showError('Group name and ID are required');
        return;
      }
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate updating the list
      const updatedGroups = groups.map(group => 
        group.id === selectedGroup.id 
          ? {
              ...group,
              id: groupForm.group_id,
              name: groupForm.name,
              description: groupForm.description
            } 
          : group
      );
      
      setGroups(updatedGroups);
      
      showSuccess('Group updated successfully');
      setShowGroupModal(false);
      
      // Reset selected group
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
      showError('Failed to update group');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      if (!selectedGroup) return;
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate removing from the list
      const updatedGroups = groups.filter(group => group.id !== selectedGroup.id);
      
      setGroups(updatedGroups);
      
      showSuccess('Group deleted successfully');
      setShowDeleteConfirm(false);
      
      // Reset selected group
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      showError('Failed to delete group');
    }
  };

  const handleAssignStudents = async () => {
    try {
      if (!selectedGroup || selectedStudents.length === 0) {
        showError('Please select students to assign');
        return;
      }
      
      // In a real implementation, this would be an API call
      await adminService.assignGroup(selectedStudents, selectedGroup.id);
      
      // Update groups (increment student count)
      const updatedGroups = groups.map(group => 
        group.id === selectedGroup.id 
          ? {...group, student_count: group.student_count + selectedStudents.length} 
          : group
      );
      
      setGroups(updatedGroups);
      
      showSuccess(`${selectedStudents.length} students assigned to group ${selectedGroup.name}`);
      setShowAssignModal(false);
      
      // Reset selections
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error assigning students:', error);
      showError('Failed to assign students to group');
    }
  };

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Group Management</h1>
        
        <Button 
          onClick={() => {
            setSelectedGroup(null);
            setGroupForm({
              name: '',
              description: '',
              group_id: ''
            });
            setShowGroupModal(true);
          }}
          icon={<FiUserPlus />}
        >
          Create New Group
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No groups found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new student group.
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => {
                  setSelectedGroup(null);
                  setGroupForm({
                    name: '',
                    description: '',
                    group_id: ''
                  });
                  setShowGroupModal(true);
                }}
                icon={<FiUserPlus />}
              >
                Create New Group
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">ID: {group.id}</p>
                    </div>
                    <div className="p-2 bg-primary-100 rounded-full text-primary-800">
                      <FiUsers size={20} />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                  
                  <div className="mt-4 flex items-center">
                    <div className="p-1 rounded-full bg-primary-50">
                      <FiUserCheck className="text-primary-500" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-600">{group.student_count} Students</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between border-t pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<FiEdit2 />}
                    onClick={() => {
                      setSelectedGroup(group);
                      setGroupForm({
                        name: group.name,
                        description: group.description || '',
                        group_id: group.id
                      });
                      setShowGroupModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<FiUserPlus />}
                    onClick={() => {
                      setSelectedGroup(group);
                      setSelectedStudents([]);
                      setShowAssignModal(true);
                    }}
                  >
                    Assign Students
                  </Button>
                  
                  <Button 
                    variant="error" 
                    size="sm"
                    icon={<FiTrash2 />}
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title={selectedGroup ? 'Edit Group' : 'Create New Group'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={selectedGroup ? handleEditGroup : handleCreateGroup}
            >
              {selectedGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="group_id">Group ID</label>
            <input
              id="group_id"
              className="input"
              type="text"
              value={groupForm.group_id}
              onChange={(e) => setGroupForm({ ...groupForm, group_id: e.target.value })}
              placeholder="E.g., CS2023A"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This ID will be used as a unique identifier for the group
            </p>
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="name">Group Name</label>
            <input
              id="name"
              className="input"
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="E.g., Computer Science 2023 A"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              className="input h-24"
              value={groupForm.description}
              onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              placeholder="Provide a description for this group"
            />
          </div>
        </div>
      </Modal>
      
      {/* Assign Students Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={selectedGroup ? `Assign Students to ${selectedGroup.name}` : 'Assign Students'}
        size="xl"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignStudents}
              disabled={selectedStudents.length === 0}
            >
              Assign {selectedStudents.length} Students
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or registration number"
                icon={<FiSearch />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => {
                        if (selectedStudents.length === filteredStudents.length) {
                          setSelectedStudents([]);
                        } else {
                          setSelectedStudents(filteredStudents.map(student => student._id));
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Group
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr 
                      key={student._id}
                      className={selectedStudents.includes(student._id) ? 'bg-primary-50' : ''}
                      onClick={() => toggleStudentSelection(student._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.registration_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.group_id || 'None'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="bg-primary-50 p-3 rounded-md">
              <p className="text-sm text-primary-700">
                {selectedStudents.length} students selected for assignment to {selectedGroup?.name}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                Note: Students already assigned to other groups will be moved to this group.
              </p>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Group"
        footer={
          <Modal.Footer.Delete
            onDelete={handleDeleteGroup}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the group "{selectedGroup?.name}"? This action cannot be undone.
        </p>
        
        <div className="mt-4 bg-yellow-50 p-3 rounded-md">
          <p className="text-sm text-yellow-700">
            Warning: Students in this group will be unassigned and need to be reassigned to another group.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default GroupManagement;