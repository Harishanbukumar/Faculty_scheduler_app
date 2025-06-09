import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Login = () => {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { registration_number, password, remember_me } = data;
      
      const user = await login(registration_number, password, remember_me);
      
      showSuccess('Login successful');
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(error.error || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Faculty Scheduler</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Registration Number"
              id="registration_number"
              type="text"
              icon={<FiUser />}
              placeholder="Enter your registration number"
              error={errors.registration_number?.message}
              {...register('registration_number', { 
                required: 'Registration number is required',
              })}
            />
            
            <Input
              label="Password"
              id="password"
              type="password"
              icon={<FiLock />}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
              })}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('remember_me')}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <Button
              type="submit"
              fullWidth
              loading={loading}
              icon={<FiLogIn />}
            >
              Sign in
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link to="/register">
                <Button variant="outline" fullWidth>
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;