import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Button, Fade } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { THEME_COLORS } from './theme';
import { keyframes } from '@mui/system';

const globeRotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pathAnimation = keyframes`
  0% {
    stroke-dashoffset: 1000;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0);
  }
  25% {
    transform: translateY(-15px) rotate(-5deg);
  }
  75% {
    transform: translateY(15px) rotate(5deg);
  }
`;

const glowAnimation = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 15px ${THEME_COLORS.accent});
  }
  50% {
    filter: drop-shadow(0 0 30px ${THEME_COLORS.accent});
  }
`;

function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [fadeIn, setFadeIn] = useState(false);
  const previousPage = location.state?.from || '/';

  useEffect(() => {
    setFadeIn(true);
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate(previousPage, { replace: true });
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate, previousPage]);

  return (
    <Box
      sx={{
        bgcolor: THEME_COLORS.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at center, ${THEME_COLORS.background} 0%, #0a0a1a 100%)`,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h20v20H0z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E")',
          opacity: 0.3,
          zIndex: 1,
        }
      }}
    >
      <Fade in={fadeIn} timeout={1000}>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 4,
              p: 6,
              borderRadius: '30px',
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              border: `1px solid rgba(${THEME_COLORS.accent}, 0.18)`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `linear-gradient(45deg, transparent, rgba(${THEME_COLORS.accent}, 0.1), transparent)`,
                animation: `${globeRotate} 10s linear infinite`,
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                animation: `${floatAnimation} 6s ease-in-out infinite`,
              }}
            >
              <ExploreIcon 
                sx={{ 
                  fontSize: 150,
                  color: THEME_COLORS.accent,
                  animation: `${glowAnimation} 3s ease-in-out infinite`,
                  transform: 'rotate(-15deg)',
                }} 
              />
              <Typography 
                variant="h1" 
                sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontWeight: 900,
                  fontSize: '3rem',
                  background: `linear-gradient(45deg, ${THEME_COLORS.accent}, #FF69B4)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 30px rgba(237, 100, 166, 0.5)',
                }}
              >
                404
              </Typography>
            </Box>

            <Typography 
              variant="h4" 
              sx={{ 
                color: THEME_COLORS.text,
                fontWeight: 700,
                textShadow: '0 0 20px rgba(0,0,0,0.5)',
                letterSpacing: 2,
              }}
            >
              Lost in Navigation
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                color: THEME_COLORS.textSecondary,
                maxWidth: '80%',
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Looks like your wanderlust led you to an unexplored territory!
            </Typography>

            <Typography 
              variant="body2" 
              sx={{ 
                color: THEME_COLORS.accent,
                fontWeight: 600,
                fontSize: '1.1rem',
                animation: `${glowAnimation} 2s ease-in-out infinite`,
              }}
            >
              Redirecting in {countdown}...
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              mt: 2,
              '& button': {
                borderRadius: '15px',
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
              }
            }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(previousPage)}
                sx={{
                  borderColor: THEME_COLORS.accent,
                  borderWidth: 2,
                  color: THEME_COLORS.accent,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: THEME_COLORS.accent,
                    bgcolor: `${THEME_COLORS.accent}20`,
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: THEME_COLORS.accent,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#D53F8C',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(237, 100, 166, 0.4)',
                }}
              >
                Return Home
              </Button>
            </Box>
          </Box>
        </Container>
      </Fade>
    </Box>
  );
}

export default NotFound;
