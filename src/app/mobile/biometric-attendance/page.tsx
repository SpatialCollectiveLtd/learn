'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Fingerprint,
  Shield,
  Clock
} from 'lucide-react';

interface Youth {
  youth_id: string;
  full_name: string;
  phone_number: string | null;
  program_type: string;
  settlement: string;
  biometric_registered: boolean;
}

interface BiometricCredential {
  id: string;
  publicKey: string;
  createdAt: string;
}

export default function BiometricAttendancePage() {
  const router = useRouter();
  
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  
  
  const [showPinAuth, setShowPinAuth] = useState(true); 
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [authStaffId, setAuthStaffId] = useState(''); 
  
  
  const [youthId, setYouthId] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<Youth | null>(null);
  const [searchResults, setSearchResults] = useState<Youth[]>([]);
  const [loading, setLoading] = useState(false);
  
  
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [biometricInProgress, setBiometricInProgress] = useState(false);
  const [biometricResult, setBiometricResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'register' | 'attend' | null>(null);
  
  
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  
  useEffect(() => {
    checkAuthentication();
    checkBiometricSupport();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('staffToken');
    const staffData = localStorage.getItem('staffData');
    
    if (token && staffData) {
      try {
        const staff = JSON.parse(staffData);
        setStaffName(staff.full_name);
        setStaffId(staff.staff_id);
        setIsAuthenticated(true);
        setShowPinAuth(false);
      } catch (error) {
        
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffData');
        
        setShowPinAuth(true);
      }
    } else {
      
      setShowPinAuth(true);
    }
  };

  const checkBiometricSupport = async () => {
    try {
      
      if (!window.PublicKeyCredential) {
        setBiometricSupported(false);
        return;
      }

      
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricSupported(available);
    } catch (error) {
      
      setBiometricSupported(false);
    }
  };

  const handlePinAuth = async () => {
    if (!authStaffId.trim()) {
      setPinError('Staff ID is required');
      return;
    }
    
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    try {
      const response = await fetch('/api/mobile/pin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          staff_id: authStaffId.toUpperCase(), 
          pin 
        })
      });

      const data = await response.json();

      if (data.success) {
        
        localStorage.setItem('staffToken', data.data.token);
        localStorage.setItem('staffData', JSON.stringify(data.data.staff));
        
        
        setStaffName(data.data.staff.full_name);
        setStaffId(data.data.staff.staff_id);
        setIsAuthenticated(true);
        setShowPinAuth(false);
        setPin('');
        setAuthStaffId('');
        setPinError('');
        
        fetchRecentAttendance();
      } else {
        setPinError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      
      setPinError('Authentication failed. Please try again.');
    }
  };

  const searchYouth = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/mobile/search-youth?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const selectYouth = async (youth: Youth) => {
    setSelectedYouth(youth);
    setSearchResults([]);
    setYouthId(youth.youth_id);
    
    
    try {
      const response = await fetch(`/api/mobile/biometric-status?youth_id=${youth.youth_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedYouth(prev => prev ? {...prev, biometric_registered: data.registered} : null);
      }
    } catch (error) {
      
    }
  };

  const registerBiometric = async () => {
    if (!selectedYouth || !biometricSupported) return;

    setBiometricInProgress(true);
    setCurrentAction('register');
    setBiometricResult(null);

    try {
      
      const challengeResponse = await fetch('/api/mobile/biometric-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        },
        body: JSON.stringify({ youth_id: selectedYouth.youth_id, action: 'register' })
      });

      const challengeData = await challengeResponse.json();
      if (!challengeData.success) {
        throw new Error(challengeData.message);
      }

      
      const publicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(challengeData.challenge),
        rp: {
          name: "Learn Platform",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(selectedYouth.youth_id),
          name: selectedYouth.youth_id,
          displayName: `${selectedYouth.full_name} - ${selectedYouth.program_type}`,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct" as AttestationConveyancePreference
      } as PublicKeyCredentialCreationOptions;

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      
      const registrationResponse = await fetch('/api/mobile/biometric-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        },
        body: JSON.stringify({
          youth_id: selectedYouth.youth_id,
          credential: {
            id: credential?.id,
            rawId: Array.from(new Uint8Array((credential as any)?.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array((credential as any)?.response?.clientDataJSON)),
              attestationObject: Array.from(new Uint8Array((credential as any)?.response?.attestationObject)),
            },
            type: credential?.type,
          },
          challengeId: challengeData.challengeId
        })
      });

      const registrationData = await registrationResponse.json();

      if (registrationData.success) {
        setBiometricResult('Biometric registered successfully!');
        setSelectedYouth(prev => prev ? {...prev, biometric_registered: true} : null);
      } else {
        setBiometricResult(registrationData.message || 'Registration failed');
      }

    } catch (error: any) {
      
      setBiometricResult(error.message || 'Biometric registration failed. Please try again.');
    } finally {
      setBiometricInProgress(false);
      setCurrentAction(null);
    }
  };

  const recordAttendance = async () => {
    if (!selectedYouth || !selectedYouth.biometric_registered) return;

    setBiometricInProgress(true);
    setCurrentAction('attend');
    setBiometricResult(null);

    try {
      
      const challengeResponse = await fetch('/api/mobile/biometric-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        },
        body: JSON.stringify({ youth_id: selectedYouth.youth_id, action: 'authenticate' })
      });

      const challengeData = await challengeResponse.json();
      if (!challengeData.success) {
        throw new Error(challengeData.message);
      }

      
      const publicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(challengeData.challenge),
        allowCredentials: challengeData.allowedCredentials.map((cred: any) => ({
          id: new Uint8Array(cred.id),
          type: 'public-key',
          transports: ['internal'],
        })),
        userVerification: "required" as UserVerificationRequirement,
        timeout: 60000,
      } as PublicKeyCredentialRequestOptions;

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      
      const attendanceResponse = await fetch('/api/mobile/biometric-attend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        },
        body: JSON.stringify({
          youth_id: selectedYouth.youth_id,
          assertion: {
            id: assertion?.id,
            rawId: Array.from(new Uint8Array((assertion as any)?.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array((assertion as any)?.response?.clientDataJSON)),
              authenticatorData: Array.from(new Uint8Array((assertion as any)?.response?.authenticatorData)),
              signature: Array.from(new Uint8Array((assertion as any)?.response?.signature)),
              userHandle: (assertion as any)?.response?.userHandle ? Array.from(new Uint8Array((assertion as any)?.response?.userHandle)) : null,
            },
            type: assertion?.type,
          },
          challengeId: challengeData.challengeId
        })
      });

      const attendanceData = await attendanceResponse.json();

      if (attendanceData.success) {
        setBiometricResult('Attendance recorded successfully!');
        fetchRecentAttendance();
        
        setTimeout(() => {
          setSelectedYouth(null);
          setYouthId('');
          setBiometricResult(null);
        }, 2000);
      } else {
        setBiometricResult(attendanceData.message || 'Attendance recording failed');
      }

    } catch (error: any) {
      
      setBiometricResult(error.message || 'Biometric verification failed. Please try again.');
    } finally {
      setBiometricInProgress(false);
      setCurrentAction(null);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const response = await fetch('/api/mobile/recent-attendance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setRecentAttendance(data.data);
      }
    } catch (error) {
      
    }
  };

  
  if (isAuthenticated && !showPinAuth && recentAttendance.length === 0) {
    setShowPinAuth(true);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (showPinAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background-card border border-border rounded-lg p-6">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-foreground mb-2">PIN Authentication</h1>
            <p className="text-foreground-muted">Enter your 4-digit PIN to access biometric attendance</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-foreground font-medium mb-2">Staff ID:</label>
              <input
                type="text"
                value={authStaffId}
                onChange={(e) => {
                  setAuthStaffId(e.target.value.toUpperCase());
                  setPinError('');
                }}
                placeholder="Enter Staff ID (e.g. SFEA4111T)"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-foreground font-medium mb-2">PIN:</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.slice(0, 4));
                  setPinError('');
                }}
                placeholder="Enter 4-digit PIN"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-2xl tracking-widest focus:outline-none focus:border-primary"
                maxLength={4}
                inputMode="numeric"
              />
              {pinError && (
                <p className="text-error text-sm mt-2">{pinError}</p>
              )}
            </div>

            <button
              onClick={handlePinAuth}
              disabled={!authStaffId.trim() || pin.length !== 4}
              className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-lg font-subheading font-semibold text-lg transition-colors"
            >
              Authenticate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {}
      <div className="bg-background-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-heading text-foreground">LEARN PLATFORM</h1>
            <p className="text-sm text-foreground-subtle">Biometric Attendance</p>
          </div>
          <div className="w-10" /> {}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-foreground-muted">Trainer: {staffName} ({staffId})</p>
          <p className="text-foreground-subtle text-sm">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {}
      {biometricSupported === false && (
        <div className="bg-error/10 border border-error/20 p-4 m-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
            <div>
              <p className="text-error font-medium">Biometric Not Supported</p>
              <p className="text-error/80 text-sm">This device doesn't support biometric authentication (TouchID/FaceID)</p>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-foreground font-medium mb-2">Enter Youth ID:</label>
            <input
              type="text"
              value={youthId}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setYouthId(value);
                setSelectedYouth(null);
                searchYouth(value);
              }}
              placeholder="KAY1604FA"
              className="w-full px-4 py-3 bg-background-card border border-border rounded-lg text-foreground text-lg font-mono focus:outline-none focus:border-primary"
            />
          </div>

          {}
          {searchResults.length > 0 && (
            <div className="bg-background-card border border-border rounded-lg">
              {searchResults.slice(0, 5).map((youth) => (
                <button
                  key={youth.youth_id}
                  onClick={() => selectYouth(youth)}
                  className="w-full p-4 text-left hover:bg-background-elevated border-b border-border last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-foreground">{youth.youth_id} - {youth.full_name}</div>
                  <div className="text-sm text-foreground-muted flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {youth.phone_number || 'No phone'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {youth.program_type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {}
          {selectedYouth && (
            <div className="bg-background-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedYouth.full_name}</h3>
                  <p className="text-foreground-muted flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {selectedYouth.youth_id}
                  </p>
                  <p className="text-foreground-muted flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedYouth.phone_number || 'No phone'}
                  </p>
                  <p className="text-foreground-muted flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4" />
                    {selectedYouth.program_type}
                  </p>
                </div>
                <div className="text-right">
                  {selectedYouth.biometric_registered ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Registered</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Not Registered</span>
                    </div>
                  )}
                </div>
              </div>

              {}
              {biometricSupported && (
                <div className="space-y-3">
                  {!selectedYouth.biometric_registered ? (
                    <button
                      onClick={registerBiometric}
                      disabled={biometricInProgress}
                      className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-lg font-subheading font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      {biometricInProgress && currentAction === 'register' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Registering Biometric...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-5 w-5" />
                          REGISTER FINGERPRINT
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={recordAttendance}
                      disabled={biometricInProgress}
                      className="w-full py-3 bg-success hover:bg-success/90 disabled:bg-success/50 text-white rounded-lg font-subheading font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      {biometricInProgress && currentAction === 'attend' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Verifying Biometric...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-5 w-5" />
                          VERIFY BIOMETRIC
                        </>
                      )}
                    </button>
                  )}

                  {!selectedYouth.biometric_registered && (
                    <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
                      <p className="text-info text-sm">
                        <strong>Instructions:</strong><br />
                        • Youth places finger on device sensor<br />
                        • Hold for 2 seconds until vibration<br />
                        • Registration complete
                      </p>
                    </div>
                  )}
                </div>
              )}

              {}
              {biometricResult && (
                <div className={`mt-4 p-3 rounded-lg ${
                  biometricResult.includes('successfully') 
                    ? 'bg-success/10 border border-success/20 text-success'
                    : 'bg-error/10 border border-error/20 text-error'
                }`}>
                  <p className="font-medium">{biometricResult}</p>
                </div>
              )}
            </div>
          )}

          {}
          {recentAttendance.length > 0 && (
            <div className="bg-background-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Attendance
              </h3>
              <div className="space-y-2">
                {recentAttendance.slice(0, 5).map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                    <div>
                      <p className="text-foreground font-medium">{record.youth_id}</p>
                      <p className="text-foreground-subtle text-sm">{record.full_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="text-foreground-subtle text-xs">
                        {new Date(record.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
