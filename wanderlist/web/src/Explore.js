import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  TextField,
  Chip,
  useTheme,
  useMediaQuery,
  Rating,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  LocationOn,
  Search,
  ExploreOutlined,
  TerrainOutlined,
  BeachAccessOutlined,
  AccountBalanceOutlined,
  ForestOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageLoader from './PageLoader';

const THEME_COLORS = {
  primary: '#00695c',
  secondary: '#00897b',
  accent: '#26a69a',
  background: '#121212',
  text: '#FFFFFF',
  cardBg: 'rgba(255, 255, 255, 0.05)',
};

const SAMPLE_LOCATIONS = [
  {
    id: '1',
    name: 'Machu Picchu',
    location: 'Peru',
    description: "Ancient Incan city in the Andes Mountains",
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&auto=format&fit=crop&q=60',
    category: 'landmarks',
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Santorini',
    location: 'Greece',
    description: "Stunning volcanic island with white-washed buildings",
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=60',
    category: 'beaches',
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Mount Fuji',
    location: 'Japan',
    description: "Japan's iconic sacred mountain",
    imageUrl: 'https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=800&auto=format&fit=crop&q=60',
    category: 'mountains',
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Great Barrier Reef',
    location: 'Australia',
    description: "World's largest coral reef system",
    imageUrl: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&auto=format&fit=crop&q=60',
    category: 'nature',
    rating: 4.9,
  },
];

const categories = [
  { id: 'all', label: 'All', icon: <ExploreOutlined /> },
  { id: 'mountains', label: 'Mountains', icon: <TerrainOutlined /> },
  { id: 'beaches', label: 'Beaches', icon: <BeachAccessOutlined /> },
  { id: 'landmarks', label: 'Landmarks', icon: <AccountBalanceOutlined /> },
  { id: 'nature', label: 'Nature', icon: <ForestOutlined /> },
];

const LocationCard = ({ location, onFavorite, isFavorite }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card
      sx={{
        bgcolor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={location.imageUrl}
        alt={location.name}
        sx={{ opacity: 0.6 }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            bgcolor: THEME_COLORS.primary,
            px: 3,
            py: 1,
            borderRadius: 1,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          Coming Soon
        </Typography>
      </Box>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          {location.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: THEME_COLORS.accent }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {location.location}
          </Typography>
        </Box>
        <Rating 
          value={location.rating} 
          readOnly 
          size="small"
          sx={{ color: THEME_COLORS.accent }}
        />
        <IconButton
          onClick={() => onFavorite(location.id)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: isFavorite ? THEME_COLORS.accent : 'rgba(255,255,255,0.7)',
            zIndex: 3,
          }}
        >
          {isFavorite ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </CardContent>
    </Card>
  </motion.div>
);

const Explore = () => {
  const [locations] = useState(SAMPLE_LOCATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredLocations = locations.filter(location => {
    const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFavorite = (locationId) => {
    setFavorites(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  useEffect(() => {
    const loadExploreData = async () => {
      try {
        // Simulate loading time for static data
        // Replace this with actual data fetching if needed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error loading explore data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExploreData();
  }, []);

  if (loading) {
    return <PageLoader message="Loading experiences..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: THEME_COLORS.background,
        color: THEME_COLORS.text,
        pt: 8,
        pb: 4,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                color: THEME_COLORS.text,
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              Explore New Horizons
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                mb: 4,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              Discover the world's most breathtaking destinations
            </Typography>
          </motion.div>

          <Grid container justifyContent="center" sx={{ mb: 6 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }} />,
                  sx: {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    '& fieldset': { 
                      border: '1px solid rgba(255,255,255,0.1)'
                    },
                    '& input': { 
                      color: '#fff',
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.5)',
                        opacity: 1
                      }
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap',
              justifyContent: 'center',
              mb: 6 
            }}
          >
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.label}
                icon={category.icon}
                onClick={() => setSelectedCategory(category.id)}
                sx={{
                  bgcolor: selectedCategory === category.id 
                    ? THEME_COLORS.primary 
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: selectedCategory === category.id 
                      ? THEME_COLORS.primary 
                      : 'rgba(255,255,255,0.1)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {filteredLocations.map((location) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={location.id}>
              <LocationCard 
                location={location}
                onFavorite={handleFavorite}
                isFavorite={favorites.includes(location.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Explore;