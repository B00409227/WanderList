import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Container,
  Alert,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db, storage } from './firebase';
import { Person, PhotoCamera, Visibility, VisibilityOff } from '@mui/icons-material';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import PageLoader from './PageLoader';

const Profile = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePicture: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [openReauthDialog, setOpenReauthDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  const avatarVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) {
    return <PageLoader message="Loading profile..." />;
  }

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setError('');
      setSuccess('');

      const userRef = doc(db, 'users', auth.currentUser.uid);
      let updateData = { ...userData };

      if (imageFile) {
        const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(storageRef);
        updateData.profilePicture = downloadURL;
      }

      await updateDoc(userRef, updateData);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError('Error updating profile: ' + error.message);
    }
  };

  const reauthenticate = async (currentPassword) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
  };

  const handlePasswordUpdate = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setPendingAction(() => async () => {
      try {
        await updatePassword(auth.currentUser, newPassword);
        setSuccess('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setOpenReauthDialog(false);
      } catch (error) {
        setError('Error updating password: ' + error.message);
      }
    });
    setOpenReauthDialog(true);
  };

  const handleReauthSubmit = async () => {
    try {
      await reauthenticate(currentPassword);
      if (pendingAction) {
        await pendingAction();
      }
      setCurrentPassword('');
      setPendingAction(null);
    } catch (error) {
      setError('Invalid current password');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 51, 102, 0.1) 0%, rgba(0,0,0,0) 50%)',
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%': { opacity: 0.5 },
          '50%': { opacity: 0.8 },
          '100%': { opacity: 0.5 },
        }
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{
              y: [0, -1000],
              opacity: [0.3, 0],
              scale: [1, 2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '100%',
              width: '2px',
              height: '50px',
              background: 'linear-gradient(to top, transparent, rgba(255, 51, 102, 0.5))',
              borderRadius: '50%',
            }}
          />
        ))}
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Box sx={{ mt: 8, mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                bgcolor: 'rgba(18, 18, 18, 0.8)',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: 'linear-gradient(45deg, rgba(255,51,102,0.1) 0%, rgba(0,0,0,0) 70%)',
                  zIndex: 0,
                }
              }}
            >
              <Stack spacing={3} alignItems="center">
                <motion.div variants={avatarVariants}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={userData.profilePicture}
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: '#FF3366',
                        border: '4px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 30px rgba(255, 51, 102, 0.3)'
                      }}
                    >
                      <Person sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Button
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: -10,
                        right: -10,
                        minWidth: 'auto',
                        p: 1.5,
                        bgcolor: '#FF3366',
                        borderRadius: '50%',
                        boxShadow: '0 4px 20px rgba(255, 51, 102, 0.4)',
                        '&:hover': { 
                          bgcolor: '#FF1744',
                          transform: 'scale(1.1)',
                          transition: 'all 0.3s ease'
                        }
                      }}
                    >
                      <PhotoCamera sx={{ color: 'white' }} />
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleImageChange}
                      />
                    </Button>
                  </Box>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Typography 
                    variant="h4" 
                    color="white" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #FF3366, #FF8C00)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Profile Settings
                  </Typography>
                </motion.div>

                {(error || success) && (
                  <motion.div 
                    variants={itemVariants}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error && (
                      <Alert severity="error" sx={{ width: '100%' }}>
                        {error}
                      </Alert>
                    )}
                    {success && (
                      <Alert severity="success" sx={{ width: '100%' }}>
                        {success}
                      </Alert>
                    )}
                  </motion.div>
                )}

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={userData.phoneNumber}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    fullWidth
                    sx={{
                      bgcolor: '#FF3366',
                      color: 'white',
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(255, 51, 102, 0.3)',
                      '&:hover': {
                        bgcolor: '#FF1744',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(255, 51, 102, 0.4)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    Update Profile
                  </Button>
                </motion.div>

                <Divider sx={{ 
                  width: '100%', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  my: 3,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100px',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #FF3366, transparent)'
                  }
                }} />

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <Button
                    variant="contained"
                    onClick={handlePasswordUpdate}
                    fullWidth
                    sx={{
                      bgcolor: '#FF3366',
                      color: 'white',
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(255, 51, 102, 0.3)',
                      '&:hover': {
                        bgcolor: '#FF1744',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(255, 51, 102, 0.4)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    Update Password
                  </Button>
                </motion.div>
              </Stack>
            </Paper>
          </Box>
        </motion.div>
      </Container>

      <Dialog open={openReauthDialog} onClose={() => setOpenReauthDialog(false)}>
        <DialogTitle sx={{ 
          bgcolor: 'rgba(18, 18, 18, 0.95)', 
          color: 'white' 
        }}>
          Please Verify Your Identity
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: 'rgba(18, 18, 18, 0.95)',
          p: 3 
        }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              type={showCurrentPassword ? 'text' : 'password'}
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiOutlinedInput-input': {
                  color: 'white',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleReauthSubmit}
              fullWidth
              sx={{
                bgcolor: '#FF3366',
                color: 'white',
                py: 1.5,
                '&:hover': {
                  bgcolor: '#FF1744',
                },
              }}
            >
              Verify
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Add these styles to your CSS or styled-components
const globalStyles = `
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

export default Profile;