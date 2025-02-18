import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  ImageList,
  ImageListItem,
  Paper,
  FormHelperText,
  useTheme,
  useMediaQuery,
  IconButton,
  Grid
} from '@mui/material';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { storage, auth } from './firebase';  // Import from local firebase config
import DownloadIcon from '@mui/icons-material/Download';
import MovieIcon from '@mui/icons-material/Movie';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const API_BASE_URL = 'https://us-central1-wanderlist-59fb6.cloudfunctions.net/api';

const MUSIC_OPTIONS = [
  { value: 'adventure', label: 'Adventure Time' },
  { value: 'epic', label: 'Epic Discovery' },
  { value: 'peaceful', label: 'Peaceful Journey' }
];

const THEME_COLORS = {
  primary: '#FF385C',
  background: '#1A1A1A',
  surface: '#242424',
  dropdownBg: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: 'rgba(255, 255, 255, 0.08)',
  hover: '#E31C5F',
  disabled: 'rgba(255, 56, 92, 0.5)'
};

const VideoMemory = ({ open, onClose, locationPhotos }) => {
  // State for video settings
  const [selectedTransition, setSelectedTransition] = useState('fade');
  const [selectedDuration, setSelectedDuration] = useState('3');
  const [selectedQuality, setSelectedQuality] = useState('23');
  const [selectedPreset, setSelectedPreset] = useState('medium');
  const [selectedResolution, setSelectedResolution] = useState('1080p');
  const [selectedFps, setSelectedFps] = useState('25');
  const [selectedZoomDirection, setSelectedZoomDirection] = useState('in');
  const [selectedZoomRate, setSelectedZoomRate] = useState('0.0015');
  const [selectedMusicVolume, setSelectedMusicVolume] = useState('0.5');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('black');
  const [selectedMusic, setSelectedMusic] = useState('adventure');

  // State for process management
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [processedPhotos, setProcessedPhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  // Constants
  const API_URL = 'https://us-central1-wanderlist-59fb6.cloudfunctions.net/api/generate-video';
  const resolutions = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };

  const commonStyles = {
    select: {
      height: '40px',
      bgcolor: THEME_COLORS.dropdownBg,
      color: THEME_COLORS.text,
      borderRadius: 1,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: THEME_COLORS.border,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: THEME_COLORS.primary,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: THEME_COLORS.primary,
      },
      '& .MuiSelect-icon': {
        color: THEME_COLORS.text,
      }
    },
    menuProps: {
      PaperProps: {
        sx: {
          bgcolor: THEME_COLORS.dropdownBg,
          border: `1px solid ${THEME_COLORS.border}`,
          '& .MuiMenuItem-root': {
            color: THEME_COLORS.text,
          }
        }
      }
    },
    sectionTitle: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: THEME_COLORS.primary,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mb: 2
    }
  };

  // Photo processing effect
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!locationPhotos || locationPhotos.length === 0) {
        setIsLoadingPhotos(false);
        setError('No route photos available');
        return;
      }

      setIsLoadingPhotos(true);
      setError(null);
      setProcessedPhotos([]);
      
      try {
        const photoUrls = await Promise.all(
          locationPhotos.map(async (photo, index) => {
            try {
              let photoUrl = photo.url || photo.downloadURL || photo.storagePath;
              
              if (!photoUrl) {
                console.error(`No URL or storage path found for photo ${index + 1}`, photo);
                return null;
              }

              // Convert storage path to URL if needed
              if (!photoUrl.startsWith('http')) {
                try {
                  const storageRef = ref(storage, photoUrl);
                  photoUrl = await getDownloadURL(storageRef);
                } catch (error) {
                  console.error(`Error getting download URL for photo ${index + 1}:`, error);
                  return null;
                }
              }

              return {
                url: photoUrl,
                original: photo,
                location: photo.location || `${photo.latitude}, ${photo.longitude}`,
                timestamp: photo.timestamp
              };
            } catch (error) {
              console.error(`Error processing route photo ${index + 1}:`, error);
              return null;
            }
          })
        );

        const validPhotos = photoUrls
          .filter(photo => photo !== null)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        if (validPhotos.length === 0) {
          throw new Error('No valid photos found from the route');
        }

        setProcessedPhotos(validPhotos);
      } catch (error) {
        console.error('Error processing route photos:', error);
        setError('Failed to load route photos: ' + error.message);
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    if (open) {
      setGeneratedVideoUrl(null);
      setError(null);
      setProgress(0);
      fetchPhotos();
    }
  }, [open, locationPhotos, storage]);

  const uploadImageToFirebase = async (file) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be logged in to upload photos');
      }

      const safeFileName = file.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      const storageRef = ref(storage, 
        `user-photos/${auth.currentUser.uid}/${Date.now()}-${safeFileName}`
      );
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw error;
    }
  };

  const handleAddPhoto = async (event) => {
    const file = event.target.files[0];
    if (file) {
      let newPhoto;
      try {
        // Upload to Firebase first
        const firebaseUrl = await uploadImageToFirebase(file);
        
        newPhoto = {
          url: firebaseUrl,  // Use Firebase URL directly
          timestamp: Date.now(),
          isLocal: false,
          isUploading: false
        };
        
        setProcessedPhotos(prev => [...prev, newPhoto]);
      } catch (error) {
        console.error('Error adding photo:', error);
        if (newPhoto) {
          setProcessedPhotos(prev => 
            prev.filter(photo => photo.timestamp !== newPhoto.timestamp)
          );
        }
      }
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setProcessedPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Ensure all URLs are valid HTTP(S) URLs
      const validPhotos = processedPhotos.filter(photo => 
        photo.url && photo.url.startsWith('http')
      );

      if (validPhotos.length === 0) {
        throw new Error('No valid photos available for video generation');
      }

      const requestData = {
        photos: validPhotos.map(photo => ({
          url: photo.url,
          duration: parseInt(selectedDuration)
        })),
        transition: selectedTransition,
        width: resolutions[selectedResolution].width,
        height: resolutions[selectedResolution].height,
        fps: parseInt(selectedFps),
        quality: parseInt(selectedQuality),
        backgroundColor: selectedBackgroundColor,
        musicTrack: selectedMusic,
        musicVolume: parseFloat(selectedMusicVolume),
        preset: selectedPreset
      };

      console.log('Sending request to:', `${API_BASE_URL}/generate-video`);
      console.log('Request data:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${API_BASE_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedVideoUrl(data.videoUrl);
      setProgress(100);
    } catch (error) {
      console.error('Video generation error:', error);
      setError(`Error generating video: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: THEME_COLORS.background,
          color: THEME_COLORS.text,
          borderRadius: { xs: 1, sm: 1 },
          m: { xs: 1, sm: 2 },
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        position: 'relative',
        px: 1.5,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${THEME_COLORS.border}`,
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: '1rem',
          fontWeight: 600 
        }}>
          Create Memory Video
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ 
            position: 'absolute',
            right: 4,
            top: 4,
            padding: '3px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            color: THEME_COLORS.textSecondary,
            '&:hover': {
              color: THEME_COLORS.text,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          <CloseIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        p: 1.5,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(255, 56, 92, 0.3)',
          borderRadius: '3px',
          '&:hover': {
            bgcolor: 'rgba(255, 56, 92, 0.5)',
          }
        },
      }}>
        {/* Photos Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={commonStyles.sectionTitle}>
            <PhotoLibraryIcon sx={{ fontSize: 18 }} />
            Selected Photos ({processedPhotos.length})
          </Typography>

          <Paper sx={{ 
            bgcolor: THEME_COLORS.surface,
            borderRadius: 1.5,
            overflow: 'hidden',
            border: `1px solid ${THEME_COLORS.border}`,
          }}>
            <ImageList 
              sx={{ 
                maxHeight: 260,
                gap: '8px !important',
                mb: 2,
                overflow: 'hidden',
                borderRadius: 1
              }}
              cols={3} 
              rowHeight={140}
            >
              {processedPhotos.map((photo, index) => (
                <ImageListItem 
                  key={index}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 1,
                    position: 'relative',
                    '&:hover .photo-actions': {
                      opacity: 1,
                    },
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`Location ${index + 1}`}
                    loading="lazy"
                    style={{ objectFit: 'cover' }}
                  />
                  <Box
                    className="photo-actions"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      p: 0.5,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '0 0 0 8px',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePhoto(index)}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          color: THEME_COLORS.primary,
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ImageListItem>
              ))}
              
              {/* Add Photo Button */}
              <ImageListItem>
                <label htmlFor="add-photo-input">
                  <Box
                    sx={{
                      height: '100%',
                      border: `2px dashed ${THEME_COLORS.border}`,
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: THEME_COLORS.primary,
                        bgcolor: 'rgba(255, 56, 92, 0.08)',
                      },
                    }}
                  >
                    <AddPhotoAlternateIcon 
                      sx={{ 
                        fontSize: 32,
                        color: THEME_COLORS.primary,
                        mb: 1 
                      }} 
                    />
                    <Typography variant="caption" sx={{ color: THEME_COLORS.textSecondary }}>
                      Add Photo
                    </Typography>
                  </Box>
                </label>
                <input
                  id="add-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAddPhoto}
                  style={{ display: 'none' }}
                />
              </ImageListItem>
            </ImageList>
          </Paper>
        </Box>

        {/* Basic Settings */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{
            ...commonStyles.sectionTitle,
            mb: 1
          }}>
            <TuneIcon sx={{ fontSize: 18 }} />
            Video Settings
          </Typography>

          <Paper sx={{ 
            p: 2.5,
            bgcolor: THEME_COLORS.surface,
            borderRadius: 1.5,
            border: `1px solid ${THEME_COLORS.border}`,
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: THEME_COLORS.textSecondary }}>
                    Transition
                  </InputLabel>
                  <Select
                    value={selectedTransition}
                    onChange={(e) => setSelectedTransition(e.target.value)}
                    label="Transition"
                    MenuProps={commonStyles.menuProps}
                    sx={commonStyles.select}
                  >
                    <MenuItem value="fade">Fade</MenuItem>
                    <MenuItem value="slide">Slide</MenuItem>
                    <MenuItem value="zoom">Zoom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: THEME_COLORS.textSecondary }}>
                    Duration
                  </InputLabel>
                  <Select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    label="Duration"
                    MenuProps={commonStyles.menuProps}
                    sx={commonStyles.select}
                  >
                    {[2,3,4,5].map(duration => (
                      <MenuItem key={duration} value={duration}>
                        {duration} seconds
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: THEME_COLORS.textSecondary }}>
                    Music
                  </InputLabel>
                  <Select
                    value={selectedMusic}
                    onChange={(e) => setSelectedMusic(e.target.value)}
                    label="Music"
                    MenuProps={commonStyles.menuProps}
                    sx={commonStyles.select}
                  >
                    {MUSIC_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Quality Settings */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{
            ...commonStyles.sectionTitle,
            mb: 1
          }}>
            <SettingsIcon sx={{ fontSize: 18 }} />
            Quality Settings
          </Typography>

          <Paper sx={{ 
            p: 2.5,
            bgcolor: THEME_COLORS.surface,
            borderRadius: 1.5,
            border: `1px solid ${THEME_COLORS.border}`,
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: THEME_COLORS.textSecondary }}>
                    Resolution
                  </InputLabel>
                  <Select
                    value={selectedResolution}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    label="Resolution"
                    MenuProps={commonStyles.menuProps}
                    sx={commonStyles.select}
                  >
                    <MenuItem value="720p">720p</MenuItem>
                    <MenuItem value="1080p">1080p (Full HD)</MenuItem>
                    <MenuItem value="4k">4K (Ultra HD)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: THEME_COLORS.textSecondary }}>
                    Frame Rate
                  </InputLabel>
                  <Select
                    value={selectedFps}
                    onChange={(e) => setSelectedFps(e.target.value)}
                    label="Frame Rate"
                    MenuProps={commonStyles.menuProps}
                    sx={commonStyles.select}
                  >
                    <MenuItem value="24">24 fps (Cinematic)</MenuItem>
                    <MenuItem value="30">30 fps (Smooth)</MenuItem>
                    <MenuItem value="60">60 fps (Ultra Smooth)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Generate Button */}
        <Box sx={{ 
          position: 'sticky',
          bottom: 0,
          pt: 1.5,
          mt: 1.5,
          borderTop: `1px solid ${THEME_COLORS.border}`,
          bgcolor: THEME_COLORS.background,
          textAlign: 'center'
        }}>
          <Button
            variant="contained"
            onClick={generateVideo}
            disabled={isGenerating || processedPhotos.length === 0}
            startIcon={isGenerating ? 
              <CircularProgress size={16} sx={{ color: 'white' }} /> : 
              <MovieIcon sx={{ fontSize: 18 }} />
            }
            sx={{
              height: 42,
              px: 3,
              bgcolor: THEME_COLORS.primary,
              fontSize: '0.9rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: THEME_COLORS.hover
              },
              '&.Mui-disabled': {
                bgcolor: THEME_COLORS.disabled
              }
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </Button>

          {isGenerating && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 56, 92, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: THEME_COLORS.primary,
                    borderRadius: 2,
                  }
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: THEME_COLORS.textSecondary,
                  display: 'block',
                  textAlign: 'center',
                  mt: 1
                }}
              >
                {progress}% complete
              </Typography>
            </Box>
          )}
        </Box>

        {/* Generated Video Preview */}
        {generatedVideoUrl && (
          <Paper sx={{ 
            p: 2.5,
            mt: 3,
            bgcolor: THEME_COLORS.surface,
            borderRadius: 1.5,
            border: `1px solid ${THEME_COLORS.border}`,
          }}>
            <Typography sx={commonStyles.sectionTitle}>
              <MovieIcon sx={{ fontSize: 18 }} />
              Generated Video
            </Typography>
            
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 Aspect Ratio
              borderRadius: 1,
              overflow: 'hidden',
              border: `1px solid ${THEME_COLORS.border}`,
              mb: 2
            }}>
              <video
                controls
                src={generatedVideoUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(generatedVideoUrl, '_blank')}
              sx={{
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text,
                '&:hover': {
                  borderColor: THEME_COLORS.primary,
                  bgcolor: 'rgba(255, 56, 92, 0.08)',
                }
              }}
            >
              Download Video
            </Button>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoMemory;

