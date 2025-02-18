// src/HomePage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Explore,
  TravelExplore,
  Map,
  LocationOn,
  ArrowForward,
  Route,
  PlayArrow,
  Phone,
  Email,
  GitHub,
  LinkedIn,
  Instagram,
  Android,
  Apple,
  KeyboardArrowUp
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLoader from './PageLoader';

// Adventure-themed images
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
  categories: {
    hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    landmarks: "https://images.unsplash.com/photo-1486299267070-83823f5448dd",
    nature: "https://images.unsplash.com/photo-1565967511849-76a60a516170",
  },
  mobileApp: {
    option1: "https://cdn.dribbble.com/userupload/13133967/file/original-7e19c7cfb9d4443c4d1a3c4c3d4f5c1d.png?resize=1504x1128", // Clean floating mockup
    option2: "https://cdn.dribbble.com/userupload/13133968/file/original-2d48f8b9d76644c1b5d6dd51a5b0c904.png?resize=1504x1128", // Hand holding phone
    option3: "https://cdn.dribbble.com/userupload/13133969/file/original-1d5b5c1d4f5c4d3c4b9d4443c4d1a3c4.png?resize=1504x1128", // Multiple screens
    option4: "https://www.pngitem.com/pimgs/m/157-1579149_android-phone-mockup-png-transparent-png.png" // Simple Android mockup
  }
};

// Add these social media constants at the top of your file
const SOCIAL_LINKS = [
  {
    icon: <GitHub />,
    name: 'GitHub',
    url: 'https://github.com/b00409227',
    color: '#ffffff'
  },
  {
    icon: <LinkedIn />,
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/abdul-hannaan-mohammed-0127a6213/',
    color: '#0077b5'
  },
  {
    icon: <Instagram />,
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    color: '#e4405f'
  }
];

// Add this component for the custom mockup
const AppMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '280px', md: '320px' },
          height: { xs: '560px', md: '640px' },
          mx: 'auto',
          borderRadius: '36px',
          border: '12px solid #333',
          background: '#121212',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            width: '40%',
            height: '24px',
            background: '#333',
            left: '50%',
            transform: 'translateX(-50%)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          }
        }}
      >
        {/* Screen Content */}
        <Box
          sx={{
            height: '100%',
            background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* App Header */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(180deg, rgba(255,51,102,0.2), transparent)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                WanderList
              </Typography>
              <IconButton size="small" sx={{ color: 'white' }}>
                <Map fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* App Content */}
          <Box sx={{ p: 2 }}>
            {/* Location Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  mb: 2,
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image="https://images.unsplash.com/photo-1486299267070-83823f5448dd"
                  alt="Location"
                />
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    London's Big Ben
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      icon={<LocationOn sx={{ fontSize: '16px !important' }} />}
                      label="2.5 km away"
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,51,102,0.2)',
                        color: '#FF3366',
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigation Dots */}
            <Stack 
              direction="row" 
              spacing={1} 
              justifyContent="center" 
              sx={{ mt: 2 }}
            >
              {[0, 1, 2].map((dot) => (
                <Box
                  key={dot}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: dot === 0 ? '#FF3366' : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Navigation Bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(0deg, #1a1a1a 0%, transparent 100%)',
            }}
          >
            <Stack 
              direction="row" 
              justifyContent="space-around"
              sx={{
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                p: 1,
              }}
            >
              {[<Explore />, <Map />, <LocationOn />].map((icon, index) => (
                <IconButton
                  key={index}
                  sx={{
                    color: index === 0 ? '#FF3366' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// Add these button animations
const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 5px 15px rgba(255, 51, 102, 0.3)',
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.95
  }
};

const HomePage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'adminLocations'));
        const locationData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocations(locationData);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExploreClick = () => {
    navigate('/map');
  };

  const handleViewCollectionsClick = () => {
    navigate('/collections', { state: { openCollections: true } });
  };

  if (loading) {
    return <PageLoader message="Loading destinations..." />;
  }

  return (
    <Box sx={{ bgcolor: '#121212', color: 'white' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url(${IMAGES.hero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            zIndex: 0,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '3rem', md: '4.5rem' },
                    fontWeight: 900,
                    letterSpacing: '-2px',
                    lineHeight: 1.1,
                  }}
                >
                  Your Next Adventure Awaits
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    maxWidth: 500,
                  }}
                >
                  Discover hidden paths, create custom routes, and explore the unexpected
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Explore />}
                    onClick={() => navigate('/map')}
                    sx={{
                      bgcolor: '#FF3366',
                      '&:hover': { bgcolor: '#E62E5C' },
                      px: 4,
                      py: 2,
                      borderRadius: 2,
                    }}
                  >
                    View Map
                  </Button>
                  <Button
                    variant="outlined"

                    size="large"
                    onClick={() => navigate('/explore')}
                    sx={{
                      color: 'white',
                      borderColor: 'white',
                      '&:hover': { borderColor: '#FF3366', color: '#FF3366' },
                      px: 4,
                      py: 2,
                      borderRadius: 2,
                    }}
                  >
                    Start Exploring
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 20, sm: 30, md: 40 },
            right: { xs: 20, sm: 30, md: 40 },
            opacity: showScrollTop ? 1 : 0,
            visibility: showScrollTop ? 'visible' : 'hidden',
            transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
            '@media print': { display: 'none' },
          }}
        >
          <IconButton
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              color: 'white',
              border: '2px solid',
              borderColor: isHovered ? '#ED64A6' : 'rgba(255,255,255,0.8)',
              padding: { xs: 1.2, sm: 1.5, md: 2 },
              backgroundColor: isHovered ? '#ED64A6' : 'rgba(26,32,44,0.8)',
              backdropFilter: 'blur(4px)',
              boxShadow: isHovered 
                ? '0 0 20px rgba(237,100,166,0.4)' 
                : '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: '#ED64A6',
                transform: 'translateY(-5px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: showScrollTop ? 'bounceIn 0.5s' : 'none',
              width: { xs: 40, sm: 48, md: 56 },
              height: { xs: 40, sm: 48, md: 56 },
            }}
            onClick={() => {
              window.scrollTo({ 
                top: 0, 
                behavior: 'smooth'
              });
            }}
            aria-label="Scroll to top"
          >
            <KeyboardArrowUp 
              sx={{ 
                fontSize: { xs: 24, sm: 28, md: 32 },
                transform: isHovered ? 'translateY(-2px)' : 'none',
                transition: 'transform 0.3s ease'
              }} 
            />
          </IconButton>
        </Box>
      </Box>

      {/* Quick Actions Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {[
            {
              icon: <Map sx={{ fontSize: 40 }}/>,
              title: 'Interactive Map',
              description: 'Navigate with real-time location tracking and custom routes',
              action: () => navigate('/map')
            },
            {
              icon: <TravelExplore sx={{ fontSize: 40 }}/>,
              title: 'Curated Collections',
              description: 'Explore our pre-planned routes and themed adventures',
              action: handleViewCollectionsClick
            },
            {
              icon: <LocationOn sx={{ fontSize: 40 }}/>,
              title: 'Custom Locations',
              description: 'Add and track your own favorite destinations',
              action: () => navigate('/map', { state: { openAddLocation: true } })
            }
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                onClick={item.action}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  }
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Box sx={{ color: '#FF3366' }}>{item.icon}</Box>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {item.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" textAlign="center" mb={8} fontWeight="700">
            Plan Your Journey
          </Typography>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ color: '#FF3366' }}>
                    Real-Time Weather Updates
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Get current weather conditions and forecasts for your destinations
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ color: '#FF3366' }}>
                    Custom Notes & Photos
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Document your journey with personal notes and photo memories
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ color: '#FF3366' }}>
                    Smart Navigation
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Follow optimized routes with turn-by-turn guidance
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1551632811-561732d1e306"
                sx={{
                  width: '100%',
                  borderRadius: 4,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                }}
                alt="Feature illustration"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h2" textAlign="center" mb={8} fontWeight="700">
          How It Works
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              number: '01',
              title: 'Choose Your Adventure',
              description: 'Select from our curated collections or create your own custom route'
            },
            {
              number: '02',
              title: 'Explore & Navigate',
              description: 'Use our interactive map with real-time tracking and weather updates'
            },
            {
              number: '03',
              title: 'Capture Memories',
              description: 'Add photos and notes to document your journey'
            },
            {
              number: '04',
              title: 'Share & Discover',
              description: 'Mark locations as visited and find new destinations'
            }
          ].map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    position: 'absolute',
                    top: -30,
                    left: -10,
                    opacity: 0.1,
                    fontSize: '8rem',
                    fontWeight: 900,
                    color: '#FF3366'
                  }}
                >
                  {step.number}
                </Typography>
                <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="h5" fontWeight="700">
                    {step.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {step.description}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Enhanced CTA Section */}
      <Box sx={{ py: 12, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url(${IMAGES.hero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Stack 
            spacing={4} 
            alignItems="center" 
            textAlign="center"
          >
            <TravelExplore sx={{ fontSize: 60, color: '#FF3366' }} />
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Start Your Adventure Today
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Join our community of explorers and create unforgettable memories
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Map />}
                onClick={handleExploreClick}
                sx={{
                  bgcolor: '#FF3366',
                  '&:hover': { bgcolor: '#E62E5C' },
                  px: 6,
                  py: 2,
                  borderRadius: 2,
                }}
              >
                Open Map
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleViewCollectionsClick}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { borderColor: '#FF3366', color: '#FF3366' },
                  px: 6,
                  py: 2,
                  borderRadius: 2,
                }}
              >
                View Collections
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Mobile App Promotion Section */}
      <Box sx={{ py: 12, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <AppMockup />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  Take Your Adventures Mobile
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  Download our Android app and explore the world from your pocket
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                      Available now on:
                    </Typography>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<Android sx={{ fontSize: 28 }} />}
                        onClick={() => window.open('/')}
                        sx={{
                          bgcolor: '#FF3366',
                          '&:hover': { bgcolor: '#E62E5C' },
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                        }}
                      >
                        Get it on Google Play
                      </Button>
                    </motion.div>
                  </Box>
                  <Stack spacing={2}>
                    <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.9)' }}>
                      <motion.span whileHover={{ scale: 1.1 }}>•</motion.span>
                      Real-time location tracking
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.9)' }}>
                      <motion.span whileHover={{ scale: 1.1 }}>•</motion.span>
                      Offline maps support
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.9)' }}>
                      <motion.span whileHover={{ scale: 1.1 }}>•</motion.span>
                      Push notifications for nearby adventures
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        sx={{ 
          bgcolor: 'rgba(0,0,0,0.3)', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          pt: 8,
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  WanderList
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Your ultimate companion for discovering and exploring new adventures.
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Connect With Us
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {SOCIAL_LINKS.map((social, index) => (
                      <motion.div
                        key={social.name}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconButton
                          onClick={() => window.open(social.url, '_blank')}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: social.color,
                            },
                            transition: 'all 0.3s ease',
                            width: 44,
                            height: 44,
                          }}
                          aria-label={`Follow us on ${social.name}`}
                        >
                          {social.icon}
                        </IconButton>
                      </motion.div>
                    ))}
                  </Stack>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      mt: 1 
                    }}
                  >
                    Follow us for updates and adventures
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Quick Links
                </Typography>
                <Button 
                  sx={{ color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-start' }}
                  onClick={() => navigate('/map')}
                >
                  Explore Map
                </Button>
                <Button 
                  sx={{ color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-start' }}
                  onClick={() => navigate('/collections')}
                >
                  Collections
                </Button>
                <Button 
                  sx={{ color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-start' }}
                  onClick={() => window.open('/')}
                >
                  Download App
                </Button>
                <Button 
                  sx={{ color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-start' }}
                  onClick={() => window.open('/privacy-policy.html', '_blank')}
                >
                  Privacy Policy
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Contact Us
                </Typography>
                <Stack spacing={2}>
                  <motion.div whileHover={{ x: 5 }}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#FF3366'
                        },
                        transition: 'color 0.3s ease'
                      }}
                      onClick={() => window.location.href = 'mailto:abdulhannaanmohammed@gmail.com'}
                    >
                      <Email sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Typography variant="body2" component="span" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        abdulhannaanmohammed@gmail.com
                      </Typography>
                    </Stack>
                  </motion.div>
                  <motion.div whileHover={{ x: 5 }}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#FF3366'
                        },
                        transition: 'color 0.3s ease'
                      }}
                      onClick={() => window.location.href = 'tel:+(44)7782483954'}
                    >
                      <Phone sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Typography variant="body2" component="span" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        +44 77824 83954
                      </Typography>
                    </Stack>
                  </motion.div>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              © {new Date().getFullYear()} WanderList. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
