import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

const BRAND = {
  maroon: '#7A1431',
  maroonLight: '#FBECEF',
  gold: '#F3C969',
  surface: '#FFFFFF',
  text: '#4A4A4A',
  muted: '#7A6A6A',
};

export default function LoginScreen() {
  const { signIn, session, student, loading: authLoading } = useAuth();
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle redirects when authenticated
  useEffect(() => {
    if (!authLoading && session) {
      if (student) {
        if (!student.face_encoding) {
          router.replace('/face-capture');
        } else {
          router.replace('/(tabs)');
        }
      } else if (session.user) {
        // Student profile might still be loading, wait a bit
        // The AuthContext will fetch it and trigger this effect again
      }
    }
  }, [session, student, authLoading]);

  const validateInputs = () => {
    if (!regNumber || regNumber.trim().length === 0) {
      setError('Please enter your registration number');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await signIn(regNumber.trim(), password);
      // Redirect will be handled by useEffect
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#771C32" />
      </View>
    );
  }

  // Don't render login form if already authenticated (redirect will happen in useEffect)
  if (session) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#771C32" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FFFFFF', '#FDF2F4', '#FBECEF']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: Platform.OS === 'android' ? 50 : 50,
                left: 20,
                padding: 6,
                zIndex: 5,
              }}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color={BRAND.maroon} />
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26 }}>
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: BRAND.maroon }}>
                  Welcome Back
                </Text>
                <Text style={{ fontSize: 14, color: BRAND.muted, marginTop: 4 }}>
                  Sign in to continue your journey
                </Text>
              </View>

              <View style={{
                backgroundColor: BRAND.surface,
                borderRadius: 20,
                padding: 26,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}>
                {/* Error Message */}
                {error ? (
                  <View style={{
                    backgroundColor: '#fef2f2',
                    borderWidth: 1,
                    borderColor: '#fecaca',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                  }}>
                    <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                {/* Registration Number Input */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: BRAND.surface,
                  borderWidth: 1,
                  borderColor: BRAND.maroonLight,
                  borderRadius: 12,
                  marginBottom: 16,
                }}>
                  <Mail size={18} color={BRAND.maroon} style={{ marginLeft: 14 }} />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      color: BRAND.text,
                    }}
                    placeholder="Registration Number"
                    placeholderTextColor="#A1A1A1"
                    value={regNumber}
                    onChangeText={setRegNumber}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {/* Password Input */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: BRAND.surface,
                  borderWidth: 1,
                  borderColor: BRAND.maroonLight,
                  borderRadius: 12,
                  marginBottom: 16,
                }}>
                  <Lock size={18} color={BRAND.maroon} style={{ marginLeft: 14 }} />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      color: BRAND.text,
                    }}
                    placeholder="Password"
                    placeholderTextColor="#A1A1A1"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingHorizontal: 14 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#A1A1A1" />
                    ) : (
                      <Eye size={18} color="#A1A1A1" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 18 }}>
                  <Text style={{ color: BRAND.maroon, fontWeight: '600' }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 20,
                    opacity: loading ? 0.7 : 1,
                  }}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[BRAND.maroon, '#9E2A48']}
                    style={{ paddingVertical: 14, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 18,
                }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
                  <Text style={{ marginHorizontal: 10, color: BRAND.muted, fontSize: 13 }}>
                    or
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
                </View>

                {/* Sign Up Link */}
                <TouchableOpacity
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/signup')}
                  disabled={loading}
                >
                  <Text style={{ color: BRAND.muted, fontSize: 15 }}>
                    Don't have an account?{' '}
                    <Text style={{ color: BRAND.maroon, fontWeight: '700' }}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

