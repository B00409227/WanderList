import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import {
  LocationOn,
  WifiOff,
  PhotoCamera,
  Collections,
  Architecture,
  Palette,
  Nightlife,
  Park,
  TheaterComedy,
  VideoLibrary,
  MusicNote,
  Download
} from '@mui/icons-material';

const AboutUs = () => {
  return (
    <Container maxWidth="lg">
      <Box py={{ xs: 4, sm: 6, md: 8 }} sx={{ color: 'white' }}>
        <Fade in timeout={1000}>
          <Typography 
            variant="h2" 
            align="center" 
            gutterBottom 
            sx={{ 
              color: '#ff69b4',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              mb: { xs: 3, sm: 4, md: 5 }
            }}
          >
            About WanderList
          </Typography>
        </Fade>

        <Zoom in timeout={1500}>
          <Paper elevation={3} sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            mt: { xs: 2, sm: 3, md: 4 }, 
            borderRadius: 2,
            backgroundColor: 'rgba(18, 18, 18, 0.9)',
            color: 'white',
            border: '1px solid rgba(255, 105, 180, 0.3)'
          }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 2, sm: 3 }
              }}
            >
              Your Personal Travel Companion
            </Typography>
            <Typography variant="body1" paragraph>
              WanderList is a revolutionary travel app designed for explorers, 
              adventurers, and urban discoverers. We help you capture and share your 
              journey while discovering the world's most fascinating places.
            </Typography>
            <Typography variant="body1" paragraph>
              Born from a passion for exploration and a desire to make travel more 
              meaningful, WanderList transforms the way you experience new destinations. 
              Whether you're wandering through bustling city streets, discovering hidden 
              local gems, or embarking on epic adventures, our app is your perfect companion 
              for creating, documenting, and sharing unforgettable moments.
            </Typography>
            <Typography variant="body1" paragraph>
              What sets WanderList apart is our unique combination of smart technology 
              and community-driven insights. Our app doesn't just show you where to go – 
              it helps you understand the soul of each location, uncover its stories, and 
              create your own narrative along the way. With both curated professional 
              recommendations and hidden spots shared by fellow travelers, you'll experience 
              destinations like never before.
            </Typography>
            <Typography variant="body1" paragraph>
              We understand that the best travel moments often happen offline, which is 
              why WanderList works seamlessly without an internet connection. From bustling 
              metropolitan centers to remote scenic locations, you'll never miss a chance 
              to capture and document your journey. Our innovative offline capabilities 
              ensure you stay oriented and informed, even in the most remote locations.
            </Typography>
            <Typography variant="body1">
              Join a growing community of passionate travelers who are redefining modern 
              exploration. Whether you're a solo adventurer, a family on vacation, or a 
              digital nomad, WanderList adapts to your travel style and helps you create 
              lasting memories that you can treasure and share for years to come. Start 
              your journey with WanderList today and transform every trip into an 
              extraordinary adventure.
            </Typography>
          </Paper>
        </Zoom>

        <Box mt={{ xs: 4, sm: 6, md: 8 }}>
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
            sx={{ 
              color: '#ff69b4',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Key Features
          </Typography>
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3, md: 4 }} 
            sx={{ mt: { xs: 1, sm: 2 } }}
          >
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Zoom in timeout={1000 + (index * 200)}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: '0.3s',
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: 'white',
                    border: '1px solid rgba(255, 105, 180, 0.3)',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-8px)' },
                      boxShadow: '0 0 20px rgba(255, 105, 180, 0.3)',
                      borderColor: '#ff69b4'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      {feature.icon}
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          color: '#ff69b4',
                          fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid 
          container 
          spacing={{ xs: 2, sm: 3, md: 4 }} 
          sx={{ mt: { xs: 2, sm: 3, md: 4 } }}
        >
          <Grid item xs={12} md={6}>
            <Fade in timeout={2000}>
              <Paper elevation={3} sx={{ 
                p: { xs: 2, sm: 3, md: 4 }, 
                borderRadius: 2,
                backgroundColor: 'rgba(18, 18, 18, 0.9)',
                color: 'white',
                border: '1px solid rgba(255, 105, 180, 0.3)',
                height: '100%'
              }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    color: '#ff69b4',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  Discover Your City
                </Typography>
                <List sx={{ py: 0 }}>
                  {discoveryItems.map((item, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in timeout={2500}>
              <Paper elevation={3} sx={{ 
                p: 4, 
                borderRadius: 2,
                backgroundColor: 'rgba(18, 18, 18, 0.9)',
                color: 'white',
                border: '1px solid rgba(255, 105, 180, 0.3)'
              }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#ff69b4' }}>
                  Create Lasting Memories
                </Typography>
                <List>
                  {memoryFeatures.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

// Feature data
const features = [
  {
    icon: <LocationOn sx={{ 
      fontSize: { xs: 32, sm: 40 }, 
      mb: { xs: 1, sm: 2 }, 
      color: '#ff69b4' 
    }} />,
    title: "Real-Time Location Tracking",
    description: "Never lose your way with our precise location tracking, even offline."
  },
  {
    icon: <WifiOff sx={{ fontSize: 40, mb: 2, color: '#ff69b4' }} />,
    title: "Offline Accessibility",
    description: "Explore without limits - all essential features work without internet connection."
  },
  {
    icon: <PhotoCamera sx={{ fontSize: 40, mb: 2, color: '#ff69b4' }} />,
    title: "Photo & Note Taking",
    description: "Document your journey with photos and personal notes at every destination."
  },
  {
    icon: <Collections sx={{ fontSize: 40, mb: 2, color: '#ff69b4' }} />,
    title: "Curated Collections",
    description: "Access our carefully curated collection of locations or add your own special places."
  }
];

const discoveryItems = [
  { 
    icon: <Architecture sx={{ 
      color: '#ff69b4',
      fontSize: { xs: 20, sm: 24 }
    }} />,
    text: "Architectural masterpieces" 
  },
  { icon: <Palette sx={{ color: '#ff69b4' }} />, text: "Contemporary art galleries" },
  { icon: <Nightlife sx={{ color: '#ff69b4' }} />, text: "Vibrant nightlife spots" },
  { icon: <LocationOn sx={{ color: '#ff69b4' }} />, text: "Urban attractions" },
  { icon: <Park sx={{ color: '#ff69b4' }} />, text: "Peaceful parks and gardens" },
  { icon: <TheaterComedy sx={{ color: '#ff69b4' }} />, text: "Entertainment venues" }
];

const memoryFeatures = [
  { icon: <VideoLibrary sx={{ color: '#ff69b4' }} />, text: "Compile your travel photos into beautiful videos" },
  { icon: <MusicNote sx={{ color: '#ff69b4' }} />, text: "Add your favorite music" },
  { icon: <PhotoCamera sx={{ color: '#ff69b4' }} />, text: "Create personalized travel documentaries" },
  { icon: <Download sx={{ color: '#ff69b4' }} />, text: "Download and share your memories" }
];

export default AboutUs;
