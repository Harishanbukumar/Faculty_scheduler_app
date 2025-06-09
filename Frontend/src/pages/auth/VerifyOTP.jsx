import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

const VerifyOTP = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Get registration number from location state
  const registrationNumber = location.state?.registration_number;
  
  // Redirect if no registration number
  useEffect(() => {
    if (!registrationNumber) {
      navigate('/register');
    }
  }, [registrationNumber, navigate]);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const response = await authService.verifyOTP(
        registrationNumber,
        data.otp
      );
      
      showSuccess('Account verification successful!');
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Verification error:', error);
      showError(error.error || 'Failed to verify account. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      
      await authService.resendOTP(registrationNumber);
      
      showSuccess('New OTP sent successfully to your mobile number.');
      setCountdown(60); // Set 60-second countdown
    } catch (error) {
      console.error('Resend OTP error:', error);
      showError(error.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the OTP sent to your mobile number
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Registration Number"
              id="registration_number"
              type="text"
              value={registrationNumber || ''}
              disabled
              readOnly
            />
            
            <Input
              label="OTP"
              id="otp"
              type="text"
              placeholder="Enter the 6-digit OTP"
              error={errors.otp?.message}
              {...register('otp', { 
                required: 'OTP is required',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'OTP must be 6 digits'
                }
              })}
            />
            
            <Button
              type="submit"
              fullWidth
              loading={loading}
              icon={<FiCheckCircle />}
            >
              Verify Account
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="flex justify-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend OTP in {countdown} seconds
                </p>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleResendOTP}
                  loading={resending}
                  icon={<FiRefreshCw />}
                >
                  Resend OTP
                </Button>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;