import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Button,
  Grid,
  Box,
  Paper,
  Stack,
  LinearProgress,
  Snackbar,
  Alert,
  Modal
} from '@mui/material';
import {
  Movie,
  MusicNote,
  Share,
  Download,
  Close
} from '@mui/icons-material';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const EndNavigationPanel = ({ open, onClose, locations }) => {
  const theme = useTheme();
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [instagramAuthOpen, setInstagramAuthOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const INSTAGRAM_APP_ID = '896750192308028';
  const REDIRECT_URI = window.location.origin;

  useEffect(() => {
    // Handle Instagram OAuth response
    const handleAuth = () => {
      const hash = window.location.hash;
      if (hash) {
        const accessToken = hash
          .substring(1)
          .split('&')
          .find(elem => elem.startsWith('access_token'))
          ?.split('=')[1];

        if (accessToken) {
          setAccessToken(accessToken);
          handleInstagramShare(accessToken);
        }
      }
    };

    handleAuth();
  }, []);

  const handleMusicSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }
      if (file.size > 10000000) { // 10MB limit
        setError('File size too large. Please select a file under 10MB');
        return;
      }
      setSelectedMusic(file);
      setError(null);
    }
  };

  const createVideoFromPhotos = async (photos, music) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      
      // Initialize FFmpeg
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();

      // Log FFmpeg messages for debugging
      ffmpeg.setLogger(({ message }) => {
        console.log('FFmpeg message:', message);
      });

      // Set progress handler
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(Math.round(ratio * 100));
      });

      // Write photos to FFmpeg virtual filesystem
      for (let i = 0; i < photos.length; i++) {
        const photoUrl = photos[i].url;
        const photoData = await fetch(photoUrl).then(r => r.arrayBuffer());
        const photoName = `image${i}.jpg`;
        await ffmpeg.writeFile(photoName, new Uint8Array(photoData));
      }

      // Create input file list
      const inputFile = 'input.txt';
      const fileContent = photos
        .map((_, i) => `file 'image${i}.jpg'`)
        .join('\n');
      await ffmpeg.writeFile(inputFile, fileContent);

      // Write music file if provided
      if (selectedMusic) {
        const musicData = await fetchFile(selectedMusic);
        await ffmpeg.writeFile('background.mp3', musicData);
      }

      // Create video from images
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'input.txt',
        '-framerate', '1/3', // Each image shows for 3 seconds
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        ...(selectedMusic ? [
          '-i', 'background.mp3',
          '-c:a', 'aac',
          '-shortest'
        ] : []),
        'output.mp4'
      ]);

      // Read the output video
      const outputData = await ffmpeg.readFile('output.mp4');
      
      // Create a blob from the video data
      const videoBlob = new Blob([outputData], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      setVideoUrl(videoUrl);
      return videoUrl;

    } catch (error) {
      console.error('Error in video creation:', error);
      throw new Error('Failed to create video: ' + error.message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCreateVideo = async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // Collect all photos from locations
      const photos = locations.reduce((acc, location) => {
        if (location.photos) {
          return [...acc, ...location.photos];
        }
        return acc;
      }, []);

      if (photos.length === 0) {
        throw new Error('No photos available to create video');
      }

      const videoUrl = await createVideoFromPhotos(photos, selectedMusic);
      setVideoUrl(videoUrl);
    } catch (error) {
      setError(error.message);
      console.error('Error in video creation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstagramShare = async (token) => {
    try {
      setIsProcessing(true);

      // Convert video to proper format if needed
      const formData = new FormData();
      const videoBlob = await fetch(videoUrl).then(r => r.blob());
      formData.append('video', videoBlob);

      // Upload to Instagram
      const response = await axios.post(
        `https://graph.instagram.com/me/media`,
        {
          access_token: token,
          media_type: 'VIDEO',
          video_url: videoUrl,
          caption: 'Check out my journey! #travel #adventure'
        }
      );

      if (response.data.id) {
        setSnackbarMessage('Successfully shared to Instagram!');
        setSnackbarSeverity('success');
      } else {
        throw new Error('Failed to share to Instagram');
      }

    } catch (error) {
      console.error('Instagram sharing error:', error);
      setSnackbarMessage('Failed to share to Instagram: ' + error.message);
      setSnackbarSeverity('error');
    } finally {
      setIsProcessing(false);
      setSnackbarOpen(true);
      setInstagramAuthOpen(false);
    }
  };

  const initiateInstagramShare = () => {
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=token`;
    
    // Open Instagram auth in a popup
    const width = 600;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      authUrl,
      'instagram-auth',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    setInstagramAuthOpen(true);
  };

  // Update the existing handleShareToInstagram function
  const handleShareToInstagram = async () => {
    if (!videoUrl) {
      setSnackbarMessage('Please create a video first');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    if (accessToken) {
      await handleInstagramShare(accessToken);
    } else {
      initiateInstagramShare();
    }
  };

  // Add Instagram Auth Modal
  const InstagramAuthModal = () => (
    <Modal
      open={instagramAuthOpen}
      onClose={() => setInstagramAuthOpen(false)}
      aria-labelledby="instagram-auth-modal"
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: theme.palette.background.default,
        boxShadow: theme.shadows[24],
        p: 4,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
        backdropFilter: 'blur(4px)',
      }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ color: theme.palette.primary.contrastText }}
        >
          Instagram Authorization
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2,
            color: theme.palette.primary.contrastText 
          }}
        >
          Please complete the authorization in the popup window to share your video.
        </Typography>
        <LinearProgress 
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
            }
          }}
        />
      </Box>
    </Modal>
  );

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'journey_video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.default,
          borderRadius: 2,
          p: 2,
          boxShadow: theme.shadows[24],
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
          backdropFilter: 'blur(4px)',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: theme.palette.primary.contrastText,
      }}>
        <Typography variant="h6">Create Your Journey Video</Typography>
        <IconButton onClick={onClose} sx={{ color: theme.palette.primary.contrastText }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Photos Grid */}
          <Grid item xs={12}>
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ color: theme.palette.primary.contrastText }}
            >
              Photos from your journey
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              p: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.primary.main,
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.primary.dark,
                },
              },
            }}>
              {locations.map((location, index) => (
                location.photos?.map((photo, photoIndex) => (
                  <Paper
                    key={`${index}-${photoIndex}`}
                    sx={{
                      width: 120,
                      height: 120,
                      backgroundImage: `url(${photo.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.2s',
                      borderRadius: 2,
                      boxShadow: theme.shadows[8],
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: theme.shadows[12],
                      }
                    }}
                  />
                ))
              ))}
            </Box>
          </Grid>

          {/* Music Selection */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<MusicNote />}
              component="label"
              fullWidth
              sx={{
                py: 1.5,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  borderColor: theme.palette.primary.light,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              {selectedMusic ? selectedMusic.name : 'Add Background Music'}
              <input
                type="file"
                hidden
                accept="audio/*"
                onChange={handleMusicSelect}
              />
            </Button>
          </Grid>

          {/* Progress Indicator */}
          {isProcessing && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main,
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1, 
                    color: theme.palette.primary.contrastText,
                    textAlign: 'center',
                  }}
                >
                  {progress}% Complete
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Movie />}
                onClick={handleCreateVideo}
                disabled={isProcessing}
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s',
                }}
              >
                {isProcessing ? 'Creating...' : 'Create Video'}
              </Button>

              {videoUrl && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Share />}
                    onClick={handleShareToInstagram}
                    disabled={isProcessing}
                    fullWidth
                    sx={{
                      py: 1.5,
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                      '&:hover': {
                        bgcolor: theme.palette.secondary.dark,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Share to Instagram
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownload}
                    fullWidth
                    sx={{
                      py: 1.5,
                      bgcolor: theme.palette.success.main,
                      color: theme.palette.success.contrastText,
                      '&:hover': {
                        bgcolor: theme.palette.success.dark,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Download
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <InstagramAuthModal />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EndNavigationPanel; 