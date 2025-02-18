import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  IconButton,
  Paper
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Security, LocationOn, Devices, Analytics, ArrowForward, Lock } from '@mui/icons-material';

const PrivacyConsent = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the privacy policy
    const hasAccepted = localStorage.getItem('privacyPolicyAccepted');
    if (!hasAccepted) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacyPolicyAccepted', 'true');
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          backgroundImage: 'none',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Lock sx={{ color: '#FF3366', fontSize: 28 }} />
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          Privacy Policy Consent
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            mb: 3,
            lineHeight: 1.6
          }}
        >
          Welcome to WanderList! Before you continue, please review our Privacy Policy.
        </Typography>

        <Box sx={{ mb: 3 }}>
          {[
            { 
              icon: <LocationOn />, 
              title: 'Location Data',
              text: 'For travel recommendations and nearby places'
            },
            { 
              icon: <Devices />, 
              title: 'Device Information',
              text: 'To optimize app functionality and performance'
            },
            { 
              icon: <Security />, 
              title: 'Personal Information',
              text: 'For account creation and security'
            },
            { 
              icon: <Analytics />, 
              title: 'Usage Data',
              text: 'To improve our services and user experience'
            }
          ].map((item, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 51, 102, 0.05)',
                  borderColor: 'rgba(255, 51, 102, 0.1)',
                }
              }}
            >
              <IconButton 
                size="small" 
                sx={{ 
                  color: '#FF3366',
                  bgcolor: 'rgba(255, 51, 102, 0.1)',
                  p: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 51, 102, 0.15)',
                  }
                }}
              >
                {item.icon}
              </IconButton>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#fff',
                    mb: 0.5,
                    fontWeight: 600
                  }}
                >
                  {item.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.5
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            px: 2
          }}
        >
          By clicking "Accept", you agree to our{' '}
          <Link 
            href="/privacy-policy.html" 
            target="_blank"
            sx={{ 
              color: '#FF3366',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Privacy Policy
          </Link>
          {' '}and consent to our data collection practices.
        </Typography>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 3,
          pt: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Button
          variant="contained"
          onClick={handleAccept}
          fullWidth
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: '#FF3366',
            color: '#fff',
            py: 1.5,
            fontSize: '0.95rem',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#E62E5C'
            },
            '&:active': {
              bgcolor: '#CC294F'
            }
          }}
        >
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyConsent;
