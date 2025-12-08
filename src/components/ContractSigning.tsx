import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ContractSigningProps {
  youthData: {
    youthId: string;
    fullName: string;
    programType: string;
  };
  token: string;
  onContractSigned: () => void;
}

export const ContractSigning: React.FC<ContractSigningProps> = ({
  youthData,
  token,
  onContractSigned,
}) => {
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const signatureRef = useRef<any>(null);

  // Network status detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    if (!navigator.onLine) {
      router.push('/offline');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/contracts/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      if (response.data.success) {
        setContract(response.data.data);
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        router.push('/offline');
        return;
      }

      if (err.response?.status === 503) {
        router.push('/maintenance');
        return;
      }

      setError(err.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
    if (signatureRef.current?.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    if (!hasAgreed) {
      alert('Please agree to the terms and conditions');
      return;
    }

    if (!navigator.onLine) {
      router.push('/offline');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      const signatureData = signatureRef.current.toDataURL();

      const response = await axios.post(
        `${API_URL}/api/contracts/sign`,
        {
          templateId: contract.templateId,
          signatureData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        onContractSigned();
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        router.push('/offline');
        return;
      }

      if (err.response?.status === 503) {
        router.push('/maintenance');
        return;
      }

      setError(err.response?.data?.message || 'Failed to sign contract');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Contract</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchContract}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center text-sm font-medium z-50 shadow-md">
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            No Internet Connection
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm"
           style={{ marginTop: !isOnline ? '36px' : '0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contract Agreement</h1>
              <p className="text-sm text-gray-600">
                Welcome, {youthData.fullName} ({youthData.youthId})
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {youthData.programType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Contract Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <h2 className="text-2xl font-bold">{contract?.title}</h2>
            <p className="text-green-100 mt-2">Version {contract?.version}</p>
          </div>

          {/* Contract Body */}
          <div className="p-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {contract?.content}
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Digital Signature</h3>

              {/* Signature Canvas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign below to agree to the terms and conditions
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'signature-canvas',
                      width: 600,
                      height: 200,
                    }}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Signature
                </button>
              </div>

              {/* Agreement Checkbox */}
              <div className="mb-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and understood all terms of this agreement. I voluntarily agree
                    to participate in the program and accept all responsibilities outlined above.
                    I confirm that the signature provided is my own.
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSign}
                  disabled={isSigning || !hasAgreed}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSigning ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing Contract...
                    </span>
                  ) : (
                    '✍️ Sign Contract Agreement'
                  )}
                </button>
              </div>

              {/* Info Note */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> By signing this contract, you acknowledge that you have
                  read, understood, and agree to all terms and conditions. A signed copy will be
                  available for download after completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSigning;
