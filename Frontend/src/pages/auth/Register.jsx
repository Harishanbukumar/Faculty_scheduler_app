import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiPhone, FiMail, FiUserPlus } from 'react-icons/fi';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

const Register = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setError } = useForm();
  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // First check if the registration number exists
      const checkResponse = await authService.register({
        registration_number: data.registration_number,
        mobile_number: data.mobile_number
      });
      
      if (checkResponse.message === "Account does not exist. Please create a password to sign up.") {
        // Continue with registration
        const response = await authService.register({
          ...data,
          password: data.password,
        });
        
        showSuccess('Registration successful! You can now login to your account.');
        
        // Redirect to login page
        navigate('/login');
      } else {
        // Account already exists
        showError('An account with this registration number already exists.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.error === "Registration number already exists") {
        setError('registration_number', {
          type: 'manual',
          message: 'An account with this registration number already exists'
        });
      } else if (error.error === "Invalid registration number format") {
        setError('registration_number', {
          type: 'manual',
          message: 'Invalid registration number format'
        });
      } else {
        showError(error.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up to Faculty Scheduler</p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Registration Number"
              id="registration_number"
              type="text"
              icon={<FiUser />}
              placeholder="Enter your registration number"
              helperText="Format: 10 digits for students, 7 digits for faculty, 'ADM' followed by 3 digits for admin"
              error={errors.registration_number?.message}
              {...register('registration_number', { 
                required: 'Registration number is required',
                pattern: {
                  value: /^(\d{10}|\d{7}|ADM\d{3})$/,
                  message: 'Invalid registration number format'
                }
              })}
            />
            
            <Input
              label="Mobile Number"
              id="mobile_number"
              type="text"
              icon={<FiPhone />}
              placeholder="Enter your mobile number"
              error={errors.mobile_number?.message}
              {...register('mobile_number', { 
                required: 'Mobile number is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Mobile number must be 10 digits'
                }
              })}
            />
            
            <Input
              label="Full Name"
              id="name"
              type="text"
              icon={<FiUser />}
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name', { 
                required: 'Full name is required',
              })}
            />
            
            <Input
              label="Email"
              id="email"
              type="email"
              icon={<FiMail />}
              placeholder="Enter your email address"
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            
            <Input
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              icon={<FiLock />}
              placeholder="Create a password"
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />
            
            <Input
              label="Confirm Password"
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              icon={<FiLock />}
              placeholder="Confirm your password"
              error={errors.confirm_password?.message}
              {...register('confirm_password', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            
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
            
            <Button
              type="submit"
              fullWidth
              loading={loading}
              icon={<FiUserPlus />}
            >
              Create Account
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link to="/login">
                <Button variant="outline" fullWidth>
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;