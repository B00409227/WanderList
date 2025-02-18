import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Mail as YahooIcon,
  CloudUpload,
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  PersonOutline,
  PhotoCamera,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, storage } from './firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Theme colors (matching your profile theme)
const THEME_COLORS = {
  primary: '#2196f3',
  secondary: '#1976d2',
  accent: '#64b5f6',
  background: '#121212',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  error: '#f44336',
  success: '#4caf50',
};

// Text field styling
const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: THEME_COLORS.text,
    backgroundColor: 'rgba(255,255,255,0.08)',
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.3)',
    },
    '&:hover fieldset': {
      borderColor: THEME_COLORS.accent,
    },
    '&.Mui-focused fieldset': {
      borderColor: THEME_COLORS.accent,
    },
  },
  '& .MuiInputLabel-root': {
    color: THEME_COLORS.textSecondary,
    '&.Mui-focused': {
      color: THEME_COLORS.accent,
    },
  },
};

const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[0-9!@#$%^&*]/.test(password)) strength += 25;
  return strength;
};

const getStrengthColor = (strength) => {
  if (strength <= 25) return THEME_COLORS.error;
  if (strength <= 50) return '#ff9800';
  if (strength <= 75) return '#ffd700';
  return THEME_COLORS.success;
};

const Auth = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const providers = {
    google: new GoogleAuthProvider(),
    github: new GithubAuthProvider(),
    yahoo: new OAuthProvider('yahoo.com')
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/map');
    } catch (error) {
      setError('Error logging in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      let photoURL = null;
      if (photo) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        photoURL
      });

      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        profilePicture: photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        phoneNumber: user.phoneNumber || '',
      });

      await sendEmailVerification(user);
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (providerName) => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, providers[providerName]);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicture: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
      }, { merge: true });

      navigate(user.displayName ? '/map' : '/profile');
    } catch (error) {
      setError(`Error with ${providerName} sign-in: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/\d/.test(password)) {
      errors.push('Include at least one number');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Include at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Include at least one lowercase letter');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Include at least one special character');
    }
    return errors;
  };

  const validateForm = () => {
    const errors = {};
    if (activeTab === 1) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors;
      }
    }
    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const renderTextField = (name, label, type = 'text', icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TextField
        label={label}
        name={name}
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        value={formData[name]}
        onChange={handleChange}
        fullWidth
        required
        error={!!formError[name]}
        helperText={
          formError[name] && 
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Array.isArray(formError[name]) 
              ? formError[name].map((err, i) => (
                  <div key={i} style={{ color: THEME_COLORS.error }}>{err}</div>
                ))
              : formError[name]
            }
          </motion.div>
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: THEME_COLORS.textSecondary }}>
              {icon}
            </InputAdornment>
          ),
          ...(type === 'password' && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: THEME_COLORS.textSecondary }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          })
        }}
        sx={{
          ...textFieldStyle,
          mb: 2
        }}
      />
      {name === 'password' && formData.password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={passwordStrength}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getStrengthColor(passwordStrength),
                  transition: 'background-color 0.3s'
                }
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: getStrengthColor(passwordStrength),
                mt: 0.5,
                display: 'block'
              }}
            >
              Password Strength: {
                passwordStrength <= 25 ? 'Weak' :
                passwordStrength <= 50 ? 'Fair' :
                passwordStrength <= 75 ? 'Good' :
                'Strong'
              }
            </Typography>
          </Box>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${THEME_COLORS.background} 0%, #1a237e 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 8,
        px: 3
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            type: "spring",
            stiffness: 100 
          }}
        >
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              transform: 'translateZ(0)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 0 ? -100 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === 0 ? 100 : -100 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    '& .MuiTab-root': {
                      color: THEME_COLORS.textSecondary,
                      '&.Mui-selected': {
                        color: THEME_COLORS.accent,
                      }
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: THEME_COLORS.accent,
                      height: 3,
                    }
                  }}
                  centered
                >
                  <Tab 
                    label="Login" 
                    sx={{
                      flex: 1,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      minHeight: 48,
                    }}
                  />
                  <Tab 
                    label="Register" 
                    sx={{
                      flex: 1,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      minHeight: 48,
                    }}
                  />
                </Tabs>

                <Box sx={{ p: 4 }}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                      </Alert>
                    </motion.div>
                  )}

                  <form onSubmit={activeTab === 0 ? handleLogin : handleRegister}>
                    <Stack spacing={3}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {activeTab === 1 && (
                          <>
                            {renderTextField('firstName', 'First Name', 'text', <PersonOutline />)}
                            {renderTextField('lastName', 'Last Name', 'text', <PersonOutline />)}
                          </>
                        )}
                        {renderTextField('email', 'Email', 'email', <EmailOutlined />)}
                        {renderTextField('password', 'Password', 'password', <LockOutlined />)}
                        {activeTab === 1 && renderTextField('confirmPassword', 'Confirm Password', 'password', <LockOutlined />)}
                      </motion.div>

                      {activeTab === 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            sx={{
                              color: THEME_COLORS.accent,
                              borderColor: THEME_COLORS.accent,
                              width: '100%',
                              py: 1
                            }}
                          >
                            Upload Profile Picture
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handlePhotoChange}
                            />
                          </Button>
                          {photo && (
                            <Typography variant="caption" color={THEME_COLORS.textSecondary}>
                              Selected file: {photo.name}
                            </Typography>
                          )}
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                          bgcolor: THEME_COLORS.accent,
                          '&:hover': {
                            bgcolor: THEME_COLORS.primary
                          }
                        }}
                      >
                        {loading ? 'Please wait...' : (activeTab === 0 ? 'Login' : 'Register')}
                      </Button>
                    </Stack>
                  </form>

                  {activeTab === 0 && (
                    <>
                      <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" color={THEME_COLORS.textSecondary}>
                          OR
                        </Typography>
                      </Divider>

                      <Stack spacing={2}>
                        <Button
                          onClick={() => handleSocialSignIn('google')}
                          startIcon={<GoogleIcon />}
                          fullWidth
                          sx={{
                            color: THEME_COLORS.text,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.1)'
                            },
                            py: { xs: 1.5, sm: 1 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Continue with Google
                        </Button>
                        <Button
                          onClick={() => handleSocialSignIn('github')}
                          startIcon={<GitHubIcon />}
                          fullWidth
                          sx={{
                            color: THEME_COLORS.text,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.1)'
                            },
                            py: { xs: 1.5, sm: 1 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Continue with GitHub
                        </Button>
                        <Button
                          onClick={() => handleSocialSignIn('yahoo')}
                          startIcon={<YahooIcon />}
                          fullWidth
                          sx={{
                            color: THEME_COLORS.text,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.1)'
                            },
                            py: { xs: 1.5, sm: 1 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Continue with Yahoo
                        </Button>
                      </Stack>
                    </>
                  )}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Auth; 