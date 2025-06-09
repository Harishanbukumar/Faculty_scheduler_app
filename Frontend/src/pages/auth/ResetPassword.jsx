import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiKey, FiArrowRight } from 'react-icons/fi';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

const ResetPassword = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Request token, 2: Reset Password
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 }, watch } = useForm();
  
  const newPassword = watch('new_password', '');

  // Step 1: Request password reset token
  const onSubmitStep1 = async (data) => {
    try {
      setLoading(true);
      
      // Send reset password request
      const response = await authService.resetPasswordRequest(data.registration_number);
      
      showSuccess('Reset instructions sent. For development, check the response for the reset token.');
      
      // Set reset token for debug purposes (in production this would be sent via email)
      if (response.debug_reset_token) {
        setResetToken(response.debug_reset_token);
      }
      
      // Move to next step
      setRegistrationNumber(data.registration_number);
      setStep(2);
    } catch (error) {
      console.error('Reset password request error:', error);
      showError(error.error || 'Failed to send reset token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with token
  const onSubmitStep2 = async (data) => {
    try {
      setLoading(true);
      
      // Reset password
      await authService.resetPassword(
        registrationNumber,
        data.reset_token,
        data.new_password
      );
      
      showSuccess('Password reset successful! You can now log in with your new password.');
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      showError(error.error || 'Failed to reset password. Please check your reset token and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? 'Enter your registration number to receive reset instructions'
              : 'Enter the reset token and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <Card>
            <form className="space-y-6" onSubmit={handleSubmitStep1(onSubmitStep1)}>
              <Input
                label="Registration Number"
                id="registration_number"
                type="text"
                icon={<FiUser />}
                placeholder="Enter your registration number"
                error={errorsStep1.registration_number?.message}
                {...registerStep1('registration_number', { 
                  required: 'Registration number is required',
                })}
              />
              
              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={<FiArrowRight />}
              >
                Request Reset Token
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to sign in
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form className="space-y-6" onSubmit={handleSubmitStep2(onSubmitStep2)}>
              <Input
                label="Registration Number"
                id="registration_number"
                type="text"
                value={registrationNumber}
                disabled
                readOnly
              />
              
              <Input
                label="Reset Token"
                id="reset_token"
                type="text"
                icon={<FiKey />}
                placeholder="Enter the reset token"
                error={errorsStep2.reset_token?.message}
                defaultValue={resetToken} // Auto-fill token for debugging
                {...registerStep2('reset_token', { 
                  required: 'Reset token is required',
                })}
              />
              
              <Input
                label="New Password"
                id="new_password"
                type={showPassword ? "text" : "password"}
                icon={<FiLock />}
                placeholder="Enter your new password"
                error={errorsStep2.new_password?.message}
                {...registerStep2('new_password', { 
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              
              <Input
                label="Confirm New Password"
                id="confirm_password"
                type={showPassword ? "text" : "password"}
                icon={<FiLock />}
                placeholder="Confirm your new password"
                error={errorsStep2.confirm_password?.message}
                {...registerStep2('confirm_password', { 
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
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
              >
                Reset Password
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;