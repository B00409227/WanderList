// src/components/Navigation.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Container,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Fade,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Map,
  Home,
  ExitToApp,
  Person,
  Explore,
  TravelExplore,
  Settings,
  Logout,
  Info,
  Dashboard,
  MapOutlined,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaInfoCircle } from 'react-icons/fa';

const THEME_COLORS = {
  primary: '#1A202C',
  accent: '#ED64A6',
  background: 'rgba(26, 32, 44, 0.95)',
  text: '#FFFFFF',
  hover: 'rgba(237, 100, 166, 0.1)',
};

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user && user.email === 'mhabz1129@gmail.com';

  // Navigation items with animations
  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const regularMenuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Explore', icon: <Explore />, path: '/explore' },
    { text: 'Map', icon: <Map />, path: '/map' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
    { text: 'About Us', icon: <FaInfoCircle />, path: '/about' },
  ];

  const adminMenuItems = [
    { text: 'Admin Map', icon: <Map />, path: '/admin-map' },
    { text: 'Admin Dashboard', icon: <Settings />, path: '/admin' },
  ];

  const menuItems = isAdmin ? adminMenuItems : regularMenuItems;

  // AppBar styles based on scroll position
  const appBarStyles = {
    background: THEME_COLORS.background,
    boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease-in-out',
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && user && location.pathname === '/' && initialLoad) {
      navigate('/admin-map');
      setInitialLoad(false);
    }
  }, [isAdmin, user, location.pathname, navigate, initialLoad]);

  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        // Initialize new user profile if it doesn't exist
        const newProfile = {
          firstName: '',
          lastName: '',
          profilePicture: '',
          email: user?.email,
          createdAt: new Date(),
        };
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{
          bgcolor: THEME_COLORS.background,
          borderBottom: `1px solid ${THEME_COLORS.hover}`,
        }}
      >
        <Container maxWidth={false}>
          <Toolbar sx={{ justifyContent: 'space-between', gap: 0 }}>
            {/* Left side - Menu Icon */}
            <Box sx={{ 
              position: 'absolute',
              left: 0
            }}>
              <IconButton
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  color: THEME_COLORS.text,
                  padding: { xs: 0.5, sm: 1 },
                }}
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            {/* Center - Logo and Brand */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                gap: 1,
                position: { xs: 'absolute', md: 'static' },
                left: { xs: '50%', md: 'auto' },
                transform: { xs: 'translateX(-50%)', md: 'none' },
                margin: { xs: '0', md: '0' },
                marginRight: { md: 'auto' }
              }}
            >
              <TravelExplore sx={{ 
                color: THEME_COLORS.accent,
                fontSize: { xs: 28, sm: 32 }
              }} />
              <Typography
                variant="h6"
                sx={{
                  color: THEME_COLORS.text,
                  fontWeight: 700,
                  fontSize: { xs: '1.2rem', sm: '1.4rem' },
                }}
              >
                WanderList
              </Typography>
            </Box>

            {/* Center - Navigation Icons */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <Tooltip title="Home">
                <IconButton 
                  component={Link} 
                  to="/"
                  sx={{ color: location.pathname === '/' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <Home />
                </IconButton>
              </Tooltip>

              <Tooltip title="Explore">
                <IconButton 
                  component={Link} 
                  to="/explore"
                  sx={{ color: location.pathname === '/explore' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <Explore />
                </IconButton>
              </Tooltip>

              <Tooltip title="Map">
                <IconButton 
                  component={Link} 
                  to="/map"
                  sx={{ color: location.pathname === '/map' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <Map />
                </IconButton>
              </Tooltip>

              <Tooltip title="Profile">
                <IconButton 
                  component={Link} 
                  to="/profile"
                  sx={{ color: location.pathname === '/profile' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <Person />
                </IconButton>
              </Tooltip>

              <Tooltip title="About">
                <IconButton 
                  component={Link} 
                  to="/about"
                  sx={{ color: location.pathname === '/about' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <Info />
                </IconButton>
              </Tooltip>

              <Tooltip title="Collections">
                <IconButton 
                  component={Link} 
                  to="/collections"
                  sx={{ color: location.pathname === '/collections' ? THEME_COLORS.accent : THEME_COLORS.text }}
                >
                  <CollectionsIcon />
                </IconButton>
              </Tooltip>

              {isAdmin && (
                <>
                  <Tooltip title="Admin Dashboard">
                    <IconButton 
                      component={Link} 
                      to="/admin"
                      sx={{ 
                        color: location.pathname === '/admin' ? THEME_COLORS.accent : THEME_COLORS.text 
                      }}
                    >
                      <Dashboard />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Admin Map">
                    <IconButton 
                      component={Link} 
                      to="/admin-map"
                      sx={{ 
                        color: location.pathname === '/admin-map' ? THEME_COLORS.accent : THEME_COLORS.text 
                      }}
                    >
                      <MapOutlined />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {user && (
                <Tooltip title="Logout">
                  <IconButton
                    component={Link}
                    to="/logout"
                    onClick={handleLogout}
                    sx={{
                      color: location.pathname === '/logout' ? THEME_COLORS.accent : THEME_COLORS.text,
                      '&:hover': { color: THEME_COLORS.accent }
                    }}
                  >
                    <Logout />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Right side - Profile and Login Button */}
            <Box sx={{ 
              position: 'absolute',
              right: 0,
              display: 'flex', 
              alignItems: 'center',
              gap: { xs: 1, sm: 2 }
            }}>
              {user && (
                <>
                  <Tooltip title="Profile">
                    <IconButton 
                      component={Link}
                      to="/profile"
                      sx={{ 
                        padding: { xs: 0.5, sm: 1 },
                        '&:hover': { transform: 'scale(1.05)' },
                      }}
                    >
                      <Avatar 
                        src={userProfile?.profilePicture}
                        sx={{ 
                          width: { xs: 32, sm: 36 },
                          height: { xs: 32, sm: 36 },
                          border: `2px solid ${THEME_COLORS.accent}`,
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {!user && (
                <Button
                  component={Link}
                  to="/auth"
                  variant="outlined"
                  size="small"
                  sx={{
                    color: THEME_COLORS.text,
                    borderColor: THEME_COLORS.accent,
                    '&:hover': {
                      borderColor: THEME_COLORS.primary,
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Add toolbar spacer to prevent content from hiding under AppBar */}
      <Toolbar />

      {/* Mobile Drawer - Updated Navigation Items */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '80%', sm: 300 },
            background: THEME_COLORS.background,
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${THEME_COLORS.hover}`
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box
            sx={{
              height: '60px',
              px: 2,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${THEME_COLORS.hover}`,
              gap: 1.5
            }}
          >
            <TravelExplore sx={{ color: THEME_COLORS.accent }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: THEME_COLORS.text,
                fontWeight: 600
              }}
            >
              WanderList
            </Typography>
          </Box>

          {/* Navigation Items - Updated to include all navigation items */}
          <List sx={{ py: 2, flex: 1 }}>
            <ListItem
              component={Link}
              to="/"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>

            <ListItem
              component={Link}
              to="/explore"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/explore' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Explore />
              </ListItemIcon>
              <ListItemText primary="Explore" />
            </ListItem>

            <ListItem
              component={Link}
              to="/map"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/map' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Map />
              </ListItemIcon>
              <ListItemText primary="Map" />
            </ListItem>

            <ListItem
              component={Link}
              to="/profile"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/profile' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>

            <ListItem
              component={Link}
              to="/collections"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/collections' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <CollectionsIcon />
              </ListItemIcon>
              <ListItemText primary="Collections" />
            </ListItem>

            <ListItem
              component={Link}
              to="/about"
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 2,
                color: location.pathname === '/about' ? THEME_COLORS.accent : THEME_COLORS.text,
                '&:hover': { bgcolor: THEME_COLORS.hover },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Info />
              </ListItemIcon>
              <ListItemText primary="About" />
            </ListItem>

            {isAdmin && (
              <>
                <ListItem
                  component={Link}
                  to="/admin"
                  onClick={handleDrawerToggle}
                  sx={{
                    py: 1.5,
                    px: 2,
                    color: location.pathname === '/admin' ? THEME_COLORS.accent : THEME_COLORS.text,
                    '&:hover': { bgcolor: THEME_COLORS.hover },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Admin Dashboard" />
                </ListItem>

                <ListItem
                  component={Link}
                  to="/admin-map"
                  onClick={handleDrawerToggle}
                  sx={{
                    py: 1.5,
                    px: 2,
                    color: location.pathname === '/admin-map' ? THEME_COLORS.accent : THEME_COLORS.text,
                    '&:hover': { bgcolor: THEME_COLORS.hover },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <MapOutlined />
                  </ListItemIcon>
                  <ListItemText primary="Admin Map" />
                </ListItem>
              </>
            )}
          </List>

          {/* Mobile User Actions */}
          {user && (
            <List sx={{ 
              py: 0, 
              borderTop: `1px solid ${THEME_COLORS.hover}`,
              mt: 'auto' // Push to bottom
            }}>
              <ListItem
                onClick={() => {
                  handleLogout();
                  handleDrawerToggle();
                }}
                sx={{
                  py: 2, // Increased padding
                  px: 3, // Increased horizontal padding
                  color: THEME_COLORS.text,
                  '&:hover': { 
                    bgcolor: THEME_COLORS.hover,
                    transition: 'background-color 0.2s ease'
                  },
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1 // Space between icon and text
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: 40,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ExitToApp />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout"
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
