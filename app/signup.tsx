// app/signup.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const BRAND = {
  maroon: '#7A1431',
  maroonLight: '#FBECEF',
  gold: '#F3C969',
  surface: '#FFFFFF',
  text: '#4A4A4A',
  muted: '#7A6A6A',
};

const DEPARTMENTS = [
  'CSE',
  'ECE',
  'MECH',
  'CIVIL',
  'IT',
  'EEE',
  'BIOTECH',
  'OTHER',
];

export default function SignupScreen() {
  const { signUp, session, loading: authLoading } = useAuth();

  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [classNumber, setClassNumber] = useState('');
  const [section, setSection] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading]);

  if (authLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={BRAND.maroon} />
      </View>
    );
  }

  if (session) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={BRAND.maroon} />
      </View>
    );
  }

  const validateInputs = () => {
    setError('');
    const reg = (regNumber || '').trim();
    const nm = (name || '').trim();
    const em = (email || '').trim();
    const ph = (phone || '').trim();
    const cls = (classNumber || '').trim();
    const sec = (section || '').trim();

    if (!reg) {
      setError('Please enter your registration number');
      return false;
    }
    if (!/^\d{4,12}$/.test(reg)) {
      setError('Registration number should be numeric (4-12 digits)');
      return false;
    }
    if (!nm || nm.length < 2) {
      setError('Please enter your full name');
      return false;
    }
    if (!em || !em.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!ph || !/^\+?\d{7,15}$/.test(ph)) {
      setError('Please enter a valid phone number (with country code if needed)');
      return false;
    }
    if (!department || department.length < 1) {
      setError('Please select your department');
      return false;
    }
    if (!cls) {
      setError('Please enter your class number');
      return false;
    }
    if (!sec) {
      setError('Please enter your section');
      return false;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    setError('');
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await signUp(
        regNumber.trim(),
        password,
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department,
        classNumber.trim(),
        section.trim()
      );

      // success -> go to face enrollment
      router.replace('/face-capture');
    } catch (err: any) {
      // show friendly message
      const msg = err?.message || err?.error || 'Sign up failed. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FFFFFF', '#FDF2F4', BRAND.maroonLight]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: Platform.OS === 'android' ? 50 : 50,
                left: 14,
                zIndex: 5,
                padding: 6,
              }}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color={BRAND.maroon} />
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 }}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.maroon, marginBottom: 6 }}>Join Sathyabama</Text>
                <Text style={{ fontSize: 14, color: BRAND.muted }}>Create your account to get started</Text>
              </View>

              <View
                style={{
                  backgroundColor: BRAND.surface,
                  borderRadius: 18,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                {error ? (
                  <View
                    style={{
                      backgroundColor: '#fef2f2',
                      borderWidth: 1,
                      borderColor: '#fecaca',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                {/* Name */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <User size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Full Name"
                    placeholderTextColor="#A1A1A1"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                {/* Reg Number */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <User size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Registration Number (e.g., 43732001)"
                    placeholderTextColor="#A1A1A1"
                    value={regNumber}
                    onChangeText={setRegNumber}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                {/* Email */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Mail size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Email Address"
                    placeholderTextColor="#A1A1A1"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {/* Phone */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Phone size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Phone (e.g., +919000000000)"
                    placeholderTextColor="#A1A1A1"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {/* Department (Picker) */}
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                    backgroundColor: BRAND.surface,
                  }}
                >
                  <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                    <Text style={{ color: BRAND.maroon, marginBottom: 6 }}>Dept</Text>
                    <View style={{ borderRadius: 8, overflow: 'hidden', borderColor: '#f1f1f1', borderWidth: 0 }}>
                      <Picker
                        selectedValue={department}
                        onValueChange={(val) => setDepartment(val)}
                        enabled={!loading}
                      >
                        {DEPARTMENTS.map((d) => (
                          <Picker.Item key={d} label={d} value={d} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Class Number */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Text style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, color: BRAND.maroon }}>Class</Text>
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Class Number (e.g., 373)"
                    placeholderTextColor="#A1A1A1"
                    value={classNumber}
                    onChangeText={setClassNumber}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                {/* Section */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Text style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, color: BRAND.maroon }}>Section</Text>
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Section (e.g., A)"
                    placeholderTextColor="#A1A1A1"
                    value={section}
                    onChangeText={setSection}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>

                {/* Password */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Lock size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Password (min 8 chars)"
                    placeholderTextColor="#A1A1A1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 12 }} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                    {showPassword ? <EyeOff size={18} color="#A1A1A1" /> : <Eye size={18} color="#A1A1A1" />}
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: BRAND.surface,
                    borderWidth: 1,
                    borderColor: BRAND.maroonLight,
                    borderRadius: 12,
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Lock size={18} color={BRAND.maroon} style={{ marginLeft: 12, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(122,20,49,0.03)' }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 12, color: BRAND.text }}
                    placeholder="Confirm Password"
                    placeholderTextColor="#A1A1A1"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 12 }} onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7}>
                    {showConfirmPassword ? <EyeOff size={18} color="#A1A1A1" /> : <Eye size={18} color="#A1A1A1" />}
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={{ borderRadius: 12, marginVertical: 14, overflow: 'hidden', opacity: loading ? 0.75 : 1 }}
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={[BRAND.maroon, '#9E2A48']} style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: BRAND.surface, fontSize: 16, fontWeight: '700' }}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }} />
                  <Text style={{ marginHorizontal: 10, color: BRAND.muted, fontSize: 13 }}>or</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }} />
                </View>

                {/* Login Link */}
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }} onPress={() => router.push('/login')} activeOpacity={0.7} disabled={loading}>
                  <Text style={{ color: BRAND.muted, fontSize: 15 }}>
                    Already have an account? <Text style={{ color: BRAND.maroon, fontWeight: '700' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <Text style={{ color: BRAND.muted, fontSize: 13, textAlign: 'center' }}>
                  After creating your account you'll be prompted to enroll FaceID / device biometric. This is used to verify your identity when marking attendance.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}
