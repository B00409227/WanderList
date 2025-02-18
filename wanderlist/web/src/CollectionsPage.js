import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box,
  TextField,
  Button,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ImageList,
  ImageListItem,
  Checkbox
} from '@mui/material';
import { 
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationOnIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { auth, db, storage } from './firebase';
import { 
  addDoc, 
  collection as firestoreCollection, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import PageLoader from './PageLoader';

const THEME = {
  primary: '#1A202C',
  accent: '#ED64A6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  hover: 'rgba(237, 100, 166, 0.1)',
  cardBg: 'rgba(26, 32, 44, 0.95)',
};

const LocationCard = React.memo(({ locationData, userNotes, isAdmin, onEditDescription, onPhotoDialogOpen, setUserNotes }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const userLocationNotes = userNotes[locationData.id] || [];
  const { currentUser } = auth;

  // Memoize handlers to prevent recreating on every render
  const handleNextPhoto = useCallback((e) => {
    e.stopPropagation();
    if (locationData.photos?.length > 0) {
      setCurrentPhotoIndex(prev => 
        prev === locationData.photos.length - 1 ? 0 : prev + 1
      );
    }
  }, [locationData.photos]);

  const handlePrevPhoto = useCallback((e) => {
    e.stopPropagation();
    if (locationData.photos?.length > 0) {
      setCurrentPhotoIndex(prev => 
        prev === 0 ? locationData.photos.length - 1 : prev - 1
      );
    }
  }, [locationData.photos]);

  const handlePhotoDialogOpen = useCallback(() => {
    onPhotoDialogOpen(locationData);
  }, [locationData, onPhotoDialogOpen]);

  // Add note handler
  const handleAddNote = async () => {
    if (!currentUser || !newNote.trim()) return;

    try {
      const noteData = {
        locationId: locationData.id,
        userId: currentUser.uid,
        text: newNote.trim(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(firestoreCollection(db, 'locationNotes'), noteData);
      
      // Update local state
      setUserNotes(prev => ({
        ...prev,
        [locationData.id]: [...(prev[locationData.id] || []), { ...noteData, id: docRef.id }]
      }));

      setNewNote('');
      setNoteDialogOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Delete note handler
  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'locationNotes', noteId));
      
      // Update local state
      setUserNotes(prev => ({
        ...prev,
        [locationData.id]: prev[locationData.id].filter(note => note.id !== noteId)
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <Card sx={{ 
      height: '100%', 
      bgcolor: THEME.surface,
      border: `1px solid ${THEME.hover}`,
      '&:hover': {
        transform: 'translateY(-4px)',
        transition: 'transform 0.3s ease',
        boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
      }
    }}>
      {/* Photos Gallery Section */}
      <Box sx={{ position: 'relative' }}>
        {locationData.photos && locationData.photos.length > 0 ? (
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="200"
              image={locationData.photos[currentPhotoIndex]}
              alt={locationData.title}
              sx={{ 
                objectFit: 'cover',
                transition: 'opacity 0.3s ease'
              }}
            />
            
            {locationData.photos.length > 1 && (
              <>
                {/* Navigation Controls */}
                <IconButton
                  onClick={handlePrevPhoto}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: THEME.accent },
                    width: 36,
                    height: 36,
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>

                <IconButton
                  onClick={handleNextPhoto}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: THEME.accent },
                    width: 36,
                    height: 36,
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>

                {/* Photo Counter */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: THEME.text,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}>
                  {`${currentPhotoIndex + 1}/${locationData.photos.length}`}
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ 
            height: 200, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.2)'
          }}>
            <PhotoLibraryIcon sx={{ color: THEME.textSecondary, fontSize: 40 }} />
          </Box>
        )}
      </Box>

      <CardContent>
        <Typography 
          variant="h6" 
          sx={{ 
            color: THEME.text,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '& .MuiSvgIcon-root': {
              fontSize: '1.2rem',
              color: THEME.textSecondary
            }
          }}
        >
          <LocationOnIcon />
          {locationData.title}
        </Typography>
        
        <Box sx={{ 
          bgcolor: 'rgba(0,0,0,0.2)', 
          p: 2, 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="body2" sx={{ color: THEME.text }}>
            {locationData.description || 'No description available'}
          </Typography>
        </Box>

        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              startIcon={<CloudUploadIcon />}
              onClick={handlePhotoDialogOpen}
              sx={{ color: THEME.accent }}
            >
              Add Photos
            </Button>
            <Button
              startIcon={<EditIcon />}
              onClick={() => onEditDescription(locationData)}
              sx={{ color: THEME.accent }}
            >
              Edit Details
            </Button>
          </Box>
        )}

        {/* Notes Section */}
        {currentUser && !isAdmin && (
          <>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'rgba(0,0,0,0.2)', 
              borderRadius: 1 
            }}>
              <Typography variant="subtitle2" sx={{ color: THEME.accent, mb: 1 }}>
                Your Notes
              </Typography>
              
              {userLocationNotes.length > 0 ? (
                userLocationNotes.map(note => (
                  <Box 
                    key={note.id}
                    sx={{ 
                      mb: 1,
                      p: 1.5,
                      bgcolor: 'rgba(0,0,0,0.3)',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: THEME.text,
                        flex: 1,
                        wordBreak: 'break-word'
                      }}
                    >
                      {note.text}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => handleDeleteNote(note.id)}
                      sx={{ 
                        color: THEME.textSecondary,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          color: '#f44336'
                        },
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                  No notes yet
                </Typography>
              )}
              
              <Button
                startIcon={<AddIcon />}
                onClick={() => setNoteDialogOpen(true)}
                sx={{ 
                  mt: 1,
                  color: THEME.accent,
                  '&:hover': { 
                    bgcolor: 'rgba(237, 100, 166, 0.1)'
                  }
                }}
              >
                Add Note
              </Button>
            </Box>

            {/* Add Note Dialog */}
            <Dialog 
              open={noteDialogOpen} 
              onClose={() => setNoteDialogOpen(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: { 
                  bgcolor: THEME.surface,
                  borderRadius: 2,
                  minHeight: '300px'
                }
              }}
            >
              <DialogTitle sx={{ 
                color: THEME.accent,
                fontSize: '1.5rem',
                fontWeight: 500,
                borderBottom: `1px solid ${THEME.hover}`,
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AddIcon sx={{ fontSize: '1.8rem' }} />
                Add Note
              </DialogTitle>
              
              <DialogContent sx={{ pt: 3 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: THEME.textSecondary,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <LocationOnIcon sx={{ fontSize: '1.2rem' }} />
                  {locationData.title}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your note here..."
                  variant="outlined"
                  sx={{ 
                    mt: 2,
                    '& .MuiOutlinedInput-root': {
                      color: THEME.text,
                      fontSize: '1.1rem',
                      lineHeight: 1.6,
                      bgcolor: 'rgba(0,0,0,0.2)',
                      '& fieldset': {
                        borderColor: THEME.hover,
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: THEME.accent,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: THEME.accent,
                      },
                      '& textarea': {
                        padding: 2,
                      }
                    },
                    '& .MuiInputBase-input': {
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      }
                    }
                  }}
                />
              </DialogContent>

              <DialogActions sx={{ 
                p: 3, 
                borderTop: `1px solid ${THEME.hover}`,
                gap: 2
              }}>
                <Button 
                  onClick={() => setNoteDialogOpen(false)}
                  variant="outlined"
                  sx={{ 
                    color: THEME.textSecondary,
                    borderColor: THEME.hover,
                    px: 4,
                    py: 1,
                    '&:hover': {
                      borderColor: THEME.textSecondary,
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddNote}
                  variant="contained"
                  disabled={!newNote.trim()}
                  sx={{ 
                    bgcolor: THEME.accent,
                    px: 4,
                    py: 1,
                    '&:hover': { 
                      bgcolor: '#D53F8C' 
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(237, 100, 166, 0.3)',
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  Add Note
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
});

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCollection, setExpandedCollection] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedLocationForNote, setSelectedLocationForNote] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [userNotes, setUserNotes] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [selectedPhotosToDelete, setSelectedPhotosToDelete] = useState([]);

  useEffect(() => {
    console.log('Component mounted');
    fetchCollections();
    fetchUserNotes();
  }, []);

  useEffect(() => {
    const checkAdminStatus = () => {
      const user = auth.currentUser;
      setIsAdmin(user?.email === 'mhabz1129@gmail.com');
    };

    checkAdminStatus();
    const unsubscribe = auth.onAuthStateChanged(checkAdminStatus);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchUserNotes();
  }, []);

  const fetchUserNotes = async () => {
    if (!auth.currentUser) return;
    
    try {
      const notesSnapshot = await getDocs(
        query(
          firestoreCollection(db, 'locationNotes'),
          where('userId', '==', auth.currentUser.uid)
        )
      );
      
      const notesData = {};
      notesSnapshot.forEach(doc => {
        const note = doc.data();
        if (!notesData[note.locationId]) {
          notesData[note.locationId] = [];
        }
        notesData[note.locationId].push({
          id: doc.id,
          ...note
        });
      });
      
      setUserNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!auth.currentUser || !selectedLocationForNote || !newNote.trim()) return;

    try {
      const noteData = {
        locationId: selectedLocationForNote.id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        text: newNote.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(firestoreCollection(db, 'locationNotes'), noteData);
      
      // Update local state
      setUserNotes(prev => ({
        ...prev,
        [selectedLocationForNote.id]: [
          ...(prev[selectedLocationForNote.id] || []),
          noteData
        ]
      }));

      setNoteDialogOpen(false);
      setNewNote('');
      setSelectedLocationForNote(null);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching collections...');

      const collectionsSnapshot = await getDocs(firestoreCollection(db, 'adminCollections'));
      const collectionsData = [];

      console.log('Number of collections:', collectionsSnapshot.size);

      for (const collectionDoc of collectionsSnapshot.docs) {
        const collectionData = { id: collectionDoc.id, ...collectionDoc.data() };
        console.log('Collection data:', collectionData);

        const locations = [];
        if (collectionData.locationIds && collectionData.locationIds.length > 0) {
          for (const locationId of collectionData.locationIds) {
            try {
              const locationDocRef = doc(db, 'adminLocations', locationId);
              const locationSnapshot = await getDoc(locationDocRef);
              
              if (locationSnapshot.exists()) {
                locations.push({
                  id: locationSnapshot.id,
                  ...locationSnapshot.data()
                });
              }
            } catch (error) {
              console.error(`Error fetching location ${locationId}:`, error);
            }
          }
        }

        collectionsData.push({
          ...collectionData,
          locations
        });
      }

      console.log('Final collections data:', collectionsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError('Failed to load collections. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDescription = useCallback((location) => {
    setSelectedLocation(location);
    setNewDescription(location.description || '');
    setEditDialogOpen(true);
  }, []);

  const handleSaveDescription = async () => {
    try {
      if (!selectedLocation) return;

      await updateDoc(doc(db, 'adminLocations', selectedLocation.id), {
        description: newDescription
      });

      // Update local state
      setCollections(collections.map(collection => ({
        ...collection,
        locations: collection.locations.map(location => 
          location.id === selectedLocation.id 
            ? { ...location, description: newDescription }
            : location
        )
      })));

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleOpenNoteDialog = (location) => {
    setSelectedLocationForNote(location);
    setNoteDialogOpen(true);
  };

  const NoteDialog = () => {
    if (isAdmin) return null;

    return (
      <Dialog 
        open={noteDialogOpen} 
        onClose={() => setNoteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: THEME.surface }
        }}
      >
        <DialogTitle sx={{ color: THEME.accent }}>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here"
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: THEME.text,
                '& fieldset': {
                  borderColor: THEME.hover,
                },
                '&:hover fieldset': {
                  borderColor: THEME.accent,
                },
                '&.Mui-focused fieldset': {
                  borderColor: THEME.accent,
                },
              },
              '& .MuiInputBase-input': {
                color: THEME.text,
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setNoteDialogOpen(false)}
            sx={{ color: THEME.textSecondary }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddNote}
            variant="contained"
            sx={{ 
              bgcolor: THEME.accent,
              '&:hover': {
                bgcolor: '#D53F8C'
              }
            }}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const handlePhotoDialogOpen = useCallback((location) => {
    setSelectedLocation(location);
    setPhotoDialogOpen(true);
  }, []);

  const PhotoUploadDialog = () => {
    // Initialize with selectedLocation's photos
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);

    // Add useEffect to load existing photos when dialog opens
    useEffect(() => {
      if (selectedLocation && selectedLocation.photos) {
        setExistingPhotos(selectedLocation.photos);
      }
    }, [selectedLocation]);

    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setPreviewPhotos(previews);
    };

    const handleDeleteSelectedPhotos = async () => {
      if (!isAdmin || !selectedLocation || selectedPhotosToDelete.length === 0) return;

      try {
        setUploadingPhoto(true);
        const locationRef = doc(db, 'adminLocations', selectedLocation.id);
        const updatedPhotos = existingPhotos.filter(photo => !selectedPhotosToDelete.includes(photo));

        await updateDoc(locationRef, {
          photos: updatedPhotos
        });

        // Update local state
        setCollections(prevCollections => 
          prevCollections.map(collection => ({
            ...collection,
            locations: collection.locations.map(loc => 
              loc.id === selectedLocation.id
                ? { ...loc, photos: updatedPhotos }
                : loc
            )
          }))
        );

        setExistingPhotos(updatedPhotos);
        setSelectedPhotosToDelete([]);
      } catch (error) {
        console.error('Error deleting photos:', error);
        alert('Failed to delete photos. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    };

    const togglePhotoSelection = (photoUrl) => {
      setSelectedPhotosToDelete(prev => 
        prev.includes(photoUrl)
          ? prev.filter(url => url !== photoUrl)
          : [...prev, photoUrl]
      );
    };

    const handlePhotoUpload = async () => {
      if (!isAdmin || !selectedLocation) return;
      
      try {
        setUploadingPhoto(true);
        const uploadedUrls = [];

        for (const file of selectedFiles) {
          const fileExtension = file.name.split('.').pop();
          const uniqueFileName = `${uuidv4()}.${fileExtension}`;
          const storageRef = ref(storage, `locations/${selectedLocation.id}/${uniqueFileName}`);
          
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          uploadedUrls.push(url);
        }

        const locationRef = doc(db, 'adminLocations', selectedLocation.id);
        const currentLocation = await getDoc(locationRef);
        const currentPhotos = currentLocation.data()?.photos || [];
        
        await updateDoc(locationRef, {
          photos: [...currentPhotos, ...uploadedUrls]
        });

        // Update local state
        setCollections(prevCollections => 
          prevCollections.map(collection => ({
            ...collection,
            locations: collection.locations.map(loc => 
              loc.id === selectedLocation.id
                ? {
                    ...loc,
                    photos: [...(loc.photos || []), ...uploadedUrls]
                  }
                : loc
            )
          }))
        );

        setSelectedFiles([]);
        setPreviewPhotos([]);
        setSelectedPhotosToDelete([]);
        setPhotoDialogOpen(false);
        
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    };

    return (
      <>
        <DialogTitle sx={{ 
          color: THEME.accent,
          fontSize: '1.5rem',
          fontWeight: 500,
          borderBottom: `1px solid ${THEME.hover}`,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon sx={{ fontSize: '1.8rem' }} />
            Manage Photos
          </Box>
          {selectedPhotosToDelete.length > 0 && (
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelectedPhotos}
              color="error"
              sx={{ 
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
              }}
            >
              Delete Selected ({selectedPhotosToDelete.length})
            </Button>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: THEME.textSecondary, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <LocationOnIcon sx={{ fontSize: '1.2rem' }} />
            {selectedLocation?.title}
          </Typography>

          {/* Existing Photos Section */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: THEME.text, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <PhotoLibraryIcon />
              Current Photos {existingPhotos.length > 0 && `(${existingPhotos.length})`}
            </Typography>
            
            {existingPhotos.length > 0 ? (
              <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={200} gap={8}>
                {existingPhotos.map((photo, index) => (
                  <ImageListItem 
                    key={index}
                    sx={{ 
                      cursor: 'pointer',
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      '&:hover .photo-overlay': {
                        opacity: 1
                      }
                    }}
                    onClick={() => togglePhotoSelection(photo)}
                  >
                    <img
                      src={photo}
                      alt={`Location photo ${index + 1}`}
                      loading="lazy"
                      style={{ 
                        height: '200px', 
                        objectFit: 'cover',
                        filter: selectedPhotosToDelete.includes(photo) ? 'brightness(0.5)' : 'none',
                        transition: 'filter 0.2s'
                      }}
                    />
                    <Box
                      className="photo-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        opacity: selectedPhotosToDelete.includes(photo) ? 1 : 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Checkbox
                        checked={selectedPhotosToDelete.includes(photo)}
                        sx={{ 
                          color: 'white',
                          '&.Mui-checked': {
                            color: THEME.accent
                          }
                        }}
                      />
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Box sx={{ 
                bgcolor: 'rgba(0,0,0,0.2)', 
                p: 3, 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1
              }}>
                <PhotoLibraryIcon sx={{ fontSize: '2rem', color: THEME.textSecondary }} />
                <Typography sx={{ color: THEME.textSecondary }}>
                  No photos uploaded yet
                </Typography>
              </Box>
            )}
          </Box>

          {/* Upload New Photos Section */}
          <Box sx={{ mb: 3 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{
                color: THEME.text,
                borderColor: THEME.hover,
                p: 2,
                '&:hover': {
                  borderColor: THEME.accent,
                  bgcolor: 'rgba(237, 100, 166, 0.1)'
                }
              }}
            >
              Select New Photos
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          {/* Preview Section */}
          {previewPhotos.length > 0 && (
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: THEME.text, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CloudUploadIcon />
                New Photos to Upload ({previewPhotos.length})
              </Typography>
              <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={200} gap={8}>
                {previewPhotos.map((preview, index) => (
                  <ImageListItem 
                    key={index}
                    sx={{ 
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={preview}
                      alt={`Upload preview ${index + 1}`}
                      loading="lazy"
                      style={{ 
                        height: '200px', 
                        objectFit: 'cover'
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${THEME.hover}`, gap: 2 }}>
          <Button 
            onClick={() => {
              setPhotoDialogOpen(false);
              setSelectedFiles([]);
              setPreviewPhotos([]);
              setSelectedPhotosToDelete([]);
            }}
            variant="outlined"
            disabled={uploadingPhoto}
            sx={{ 
              color: THEME.textSecondary,
              borderColor: THEME.hover,
              px: 4
            }}
          >
            Cancel
          </Button>
          {selectedFiles.length > 0 && (
            <Button 
              onClick={handlePhotoUpload}
              variant="contained"
              disabled={uploadingPhoto}
              sx={{ 
                bgcolor: THEME.accent,
                px: 4,
                '&:hover': { bgcolor: '#D53F8C' }
              }}
            >
              {uploadingPhoto ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} New Photo${selectedFiles.length > 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </DialogActions>
      </>
    );
  };

  if (loading) {
    return <PageLoader message="Loading collections..." />;
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'error.main'
      }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (collections.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Typography>No collections found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: THEME.background, 
      minHeight: '100vh',
      pt: { xs: 2, sm: 2 },
      pb: 4,
      mt: { xs: 7, sm: 8 },
      color: THEME.text,
      position: 'relative',
      zIndex: 0,
      '&:before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh',
        bgcolor: THEME.background,
        zIndex: -1
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Collections Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: THEME.accent,
              fontWeight: 500,
              pb: 1.5,
              borderBottom: `2px solid ${THEME.accent}`,
              '&::after': {
                content: '""',
                display: 'block',
                width: '100%',
                height: '1px',
                bgcolor: 'rgba(237, 100, 166, 0.1)',
                mt: 1.5
              }
            }}
          >
            Collections
          </Typography>
        </Box>

        {collections.map((collection) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ 
              mb: 3,
              bgcolor: THEME.cardBg,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${THEME.hover}`,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box 
                  onClick={() => setExpandedCollection(
                    expandedCollection === collection.id ? null : collection.id
                  )}
                  sx={{ 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.4)',
                    }
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ color: THEME.text }}>
                      {collection.name || 'Unnamed Collection'}
                    </Typography>
                    {collection.locations.length > 0 && (
                      <Typography 
                        variant="body2" 
                        sx={{ color: THEME.textSecondary }}
                      >
                        {collection.locations.length} location{collection.locations.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                  
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCollection(
                        expandedCollection === collection.id ? null : collection.id
                      );
                    }}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      width: 36,
                      height: 36,
                      '&:hover': {
                        bgcolor: 'rgba(237, 100, 166, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                      transform: expandedCollection === collection.id ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <ExpandMoreIcon sx={{ 
                      color: THEME.text,
                      transition: 'transform 0.2s ease'
                    }} />
                  </IconButton>
                </Box>

                <Collapse in={expandedCollection === collection.id}>
                  <Grid container spacing={3}>
                    {collection.locations.map((location) => (
                      <Grid item xs={12} sm={6} md={4} key={location.id}>
                        <LocationCard
                          locationData={location}
                          userNotes={userNotes}
                          isAdmin={isAdmin}
                          onEditDescription={handleEditDescription}
                          onPhotoDialogOpen={handlePhotoDialogOpen}
                          setUserNotes={setUserNotes}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              bgcolor: THEME.surface,
              minHeight: '400px',
              '& .MuiDialogTitle-root': {
                borderBottom: `1px solid ${THEME.hover}`,
                pb: 2
              }
            }
          }}
        >
          <DialogTitle sx={{ 
            color: THEME.accent,
            fontSize: '1.5rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EditIcon sx={{ fontSize: '1.8rem' }} />
            Edit Location Description
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: THEME.textSecondary,
                mb: 2
              }}
            >
              {selectedLocation?.title}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={8}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Enter location description..."
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  color: THEME.text,
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  '& fieldset': {
                    borderColor: THEME.hover,
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: THEME.accent,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME.accent,
                  },
                  '& textarea': {
                    padding: 2,
                  }
                },
                '& .MuiInputBase-input': {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  }
                }
              }}
            />
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            borderTop: `1px solid ${THEME.hover}`,
            gap: 2
          }}>
            <Button 
              onClick={() => setEditDialogOpen(false)}
              variant="outlined"
              sx={{ 
                color: THEME.textSecondary,
                borderColor: THEME.hover,
                px: 4,
                '&:hover': {
                  borderColor: THEME.textSecondary,
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDescription}
              variant="contained"
              disabled={!newDescription.trim() || newDescription === selectedLocation?.description}
              sx={{ 
                bgcolor: THEME.accent,
                px: 4,
                '&:hover': {
                  bgcolor: '#D53F8C'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(237, 100, 166, 0.3)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Photo Upload Dialog */}
        <Dialog
          open={photoDialogOpen}
          onClose={() => !uploadingPhoto && setPhotoDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              bgcolor: THEME.surface,
              minHeight: '400px'
            }
          }}
        >
          <PhotoUploadDialog />
        </Dialog>

        <NoteDialog />
      </Container>
    </Box>
  );
};

export default CollectionsPage; 