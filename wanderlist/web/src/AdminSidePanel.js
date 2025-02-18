import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import NotesIcon from '@mui/icons-material/Notes';
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections';
import ImageIcon from '@mui/icons-material/Image';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import {
  db,
  auth
} from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  getDoc,
  arrayRemove,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import PropTypes from 'prop-types';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';
import DialogActions from '@mui/material/DialogActions';

const THEME_COLORS = {
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#FF3366',
    secondary: '#ED64A6'
};

const AdminSidePanel = ({
  user,
  location,
  onClose,
  collections,
  handleAddToCollection,
  onCollectionUpdate,
  adminLocations,
  onDeleteLocation
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collectionLocations, setCollectionLocations] = useState([]);
  const locationId = location?.id;
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [currentLocationCollections, setCurrentLocationCollections] = useState([]);
  const [deleteLocationConfirmOpen, setDeleteLocationConfirmOpen] = useState(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);

  // Fetch notes and photos for the selected location
  useEffect(() => {
    const fetchNotesAndPhotos = async () => {
      if (locationId) {
        const notesQuery = query(collection(db, 'adminNotes'), where("locationId", "==", locationId));
        const photosQuery = query(collection(db, 'adminPhotos'), where("locationId", "==", locationId));

        const notesSnapshot = await getDocs(notesQuery);
        const photosSnapshot = await getDocs(photosQuery);

        setNotes(notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPhotos(photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };

    fetchNotesAndPhotos();
  }, [locationId]);

  // Update the fetchCollectionLocations function
  const fetchCollectionLocations = async (collectionId) => {
    try {
      console.log('Fetching locations for collection:', collectionId);
      const collectionRef = doc(db, 'adminCollections', collectionId);
      const docSnap = await getDoc(collectionRef);

      if (docSnap.exists()) {
        const { locationIds = [] } = docSnap.data();
        
        const locationPromises = locationIds.map(async (id) => {
          try {
            // First check adminLocations collection
            const locationRef = doc(db, 'adminLocations', id);
            const locationDoc = await getDoc(locationRef);
            
            if (locationDoc.exists()) {
              const data = locationDoc.data();
              return {
                id: locationDoc.id,
                ...data,
                address: data.address || data.title || 'Unnamed Location',
                title: data.title || data.address || 'Unnamed Location'
              };
            }
            
            // If it's a HERE location and not in adminLocations
            if (id.startsWith('here:')) {
              // Try to get location details from the passed adminLocations prop
              const hereLocation = adminLocations?.find(loc => loc.id === id) || location;
              
              if (hereLocation) {
                return {
                  id: id,
                  address: hereLocation.title || hereLocation.address || 'Unnamed Location',
                  title: hereLocation.title || hereLocation.address || 'Unnamed Location',
                  lat: hereLocation.lat,
                  lng: hereLocation.lng,
                  type: 'here'
                };
              }
            }
            
            return null;
          } catch (error) {
            console.error('Error fetching location:', id, error);
            return null;
          }
        });

        const locations = await Promise.all(locationPromises);
        const validLocations = locations.filter(loc => loc !== null);
        console.log('Valid locations fetched:', validLocations);
        
        setCollectionLocations(validLocations);
        
        if (onCollectionUpdate) {
          onCollectionUpdate(collectionId, validLocations);
        }
      }
    } catch (error) {
      console.error('Error fetching collection locations:', error);
      setCollectionLocations([]);
    }
  };

  // Update the useEffect to listen for real-time updates
  useEffect(() => {
    if (!selectedCollection) return;

    console.log('Setting up listener for collection:', selectedCollection);
    
    const unsubscribe = onSnapshot(
      doc(db, 'adminCollections', selectedCollection),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          await fetchCollectionLocations(selectedCollection);
        }
      }
    );

    // Initial fetch
    fetchCollectionLocations(selectedCollection);

    return () => unsubscribe();
  }, [selectedCollection]);

  // Add location to a collection
  const handleAddToCollectionLocal = async () => {
    if (!selectedCollection || !location?.id) return;

    try {
      console.log('Adding location:', location);
      
      // First, save the HERE location details to adminLocations
      if (location.id.startsWith('here:')) {
        const locationRef = doc(db, 'adminLocations', location.id);
        await setDoc(locationRef, {
          address: location.title || location.address || '',
          title: location.title || location.address || 'Unnamed Location',
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date(),
          type: 'here'
        }, { merge: true });
      }

      // Then add to collection
      const collectionRef = doc(db, 'adminCollections', selectedCollection);
      await updateDoc(collectionRef, {
        locationIds: arrayUnion(location.id)
      });

      console.log('Successfully added location to collection');
      await fetchCollectionLocations(selectedCollection);
    } catch (error) {
      console.error('Error adding location to collection:', error);
    }
  };

  // Add or update a note
  const handleSubmitNote = async () => {
    if (!newNoteText || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingNoteId) {
        const noteRef = doc(db, 'adminNotes', editingNoteId);
        await updateDoc(noteRef, { text: newNoteText });
      } else {
        const docRef = await addDoc(collection(db, 'adminNotes'), {
          text: newNoteText,
          userId: user.uid,
          locationId,
          timestamp: new Date()
        });
        setNotes(prevNotes => [...prevNotes, { id: docRef.id, text: newNoteText }]);
      }
      setNewNoteText('');
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error adding/updating note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'adminNotes', noteId));
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Upload a new photo
  const handleSubmitPhoto = async () => {
    if (!selectedPhoto || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `adminPhotos/${selectedPhoto.name}`);
      await uploadBytes(storageRef, selectedPhoto);
      const url = await getDownloadURL(storageRef);

      const docRef = await addDoc(collection(db, 'adminPhotos'), {
        url,
        userId: user.uid,
        locationId,
        timestamp: new Date()
      });
      setPhotos(prevPhotos => [...prevPhotos, { id: docRef.id, url }]);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing photo
  const handleUpdatePhoto = async (photoId, photoUrl) => {
    if (!selectedPhoto || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const storage = getStorage();
      const oldPhotoRef = ref(storage, photoUrl);
      await deleteObject(oldPhotoRef);

      const newStorageRef = ref(storage, `adminPhotos/${selectedPhoto.name}`);
      await uploadBytes(newStorageRef, selectedPhoto);
      const newUrl = await getDownloadURL(newStorageRef);

      await updateDoc(doc(db, 'adminPhotos', photoId), { url: newUrl, timestamp: new Date() });
      setPhotos(prevPhotos => prevPhotos.map(photo => photo.id === photoId ? { ...photo, url: newUrl } : photo));
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error updating photo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a photo
  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;
    
    setIsDeleting(true);
    try {
      const storage = getStorage();
      const photoRef = ref(storage, photoToDelete.url);
      await deleteObject(photoRef);
      await deleteDoc(doc(db, 'adminPhotos', photoToDelete.id));
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoToDelete.id));
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setPhotoToDelete(null);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!selectedCollection || !locationId) return;

    setIsRemoving(true);
    try {
      const collectionRef = doc(db, 'adminCollections', selectedCollection);
      await updateDoc(collectionRef, {
        locationIds: arrayRemove(locationId)
      });
      // The real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error removing location from collection:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDownload = async (url, filename = 'photo.jpg') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const handleDeleteConfirm = (photo) => {
    setPhotoToDelete(photo);
    setDeleteConfirmOpen(true);
  };

  // Add useEffect to fetch collections for current location
  useEffect(() => {
    if (!location?.id || !collections) return;
    
    const belongsTo = collections.filter(collection => 
      collection.locationIds?.includes(location.id)
    );
    setCurrentLocationCollections(belongsTo);
  }, [location, collections]);

  const handleDeleteLocation = async () => {
    if (!location?.id || isDeletingLocation) return;

    setIsDeletingLocation(true);
    try {
      await onDeleteLocation(location.id);
      setDeleteLocationConfirmOpen(false);
      onClose(); // Close the side panel
    } catch (error) {
      console.error('Error deleting location:', error);
    } finally {
      setIsDeletingLocation(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: '#fff',
          minHeight: { xs: '100vh', sm: '80vh' },
          maxHeight: { xs: '100vh', sm: '90vh' },
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 1.5 },
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
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: '1rem',
          fontWeight: 600 
        }}>
          {location.title}
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
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          <CloseIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        p: 1.5,
        backgroundColor: THEME_COLORS.background,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(255, 64, 129, 0.3)',
          borderRadius: '3px',
          '&:hover': {
            bgcolor: 'rgba(255, 64, 129, 0.5)',
          }
        },
      }}>
        {/* Current Collections Section */}
        {currentLocationCollections.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ 
              mb: 1, 
              color: '#fff',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CollectionsIcon sx={{ fontSize: 18 }} />
              Current Collections:
            </Typography>
            <Stack 
              direction="row" 
              flexWrap="wrap" 
              gap={1}
              sx={{ mb: 2 }}
            >
              {currentLocationCollections.map((collection) => (
                <Chip
                  key={collection.id}
                  label={collection.name}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(237, 100, 166, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(237, 100, 166, 0.3)',
                    '& .MuiChip-label': {
                      fontSize: '0.8rem'
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Collection Management Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#ff4081',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <CollectionsIcon sx={{ fontSize: 18 }} />
            Collection Management
          </Typography>
          
          <Paper sx={{ 
            bgcolor: '#242424',
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2
          }}>
            <TextField
              select
              fullWidth
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              SelectProps={{
                native: true,
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  backgroundColor: '#333',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ff4081',
                  },
                },
                '& select': {
                  '&:focus': {
                    backgroundColor: '#333',
                  },
                  '& option': {
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                  },
                },
                '& .MuiSelect-select': {
                  '&:focus': {
                    backgroundColor: '#333',
                  },
                },
              }}
            >
              <option value="" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                Select a collection
              </option>
              {collections.map((col) => (
                <option 
                  key={col.id} 
                  value={col.id}
                  style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                >
                  {col.name}
                </option>
              ))}
            </TextField>

            {selectedCollection && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleAddToCollectionLocal}
                disabled={collectionLocations.some(loc => loc.id === location?.id)}
                sx={{
                  backgroundColor: '#ff4081',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#f50057',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255, 64, 129, 0.5)',
                  }
                }}
              >
                {collectionLocations.some(loc => loc.id === location?.id) 
                  ? 'Already in Collection' 
                  : 'Add to Collection'
                }
              </Button>
            )}

            {/* Collection Locations List */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                Locations in Collection:
              </Typography>
              {collectionLocations.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  No locations in this collection
                </Typography>
              ) : (
                <List sx={{ 
                  width: '100%',
                  bgcolor: 'transparent'
                }}>
                  {collectionLocations.map((loc) => (
                    <ListItem
                      key={loc.id}
                      sx={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                        }
                      }}
                    >
                      <ListItemText
                        primary={loc.title || loc.address}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: '#fff',
                            fontSize: '0.9rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Notes Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#ff4081',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <NotesIcon sx={{ fontSize: 18 }} />
            Admin Notes
          </Typography>

          <Paper sx={{ 
            bgcolor: '#242424',
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2
          }}>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Enter your note"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmitNote}
              disabled={isSubmitting}
              sx={{
                backgroundColor: '#ff4081',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#f50057',
                },
              }}
            >
              {isSubmitting ? 'Saving...' : editingNoteId ? 'Update Note' : 'Add Note'}
            </Button>

            {/* Notes List */}
            <Box sx={{ mt: 2 }}>
              {notes.map((note) => (
                <Paper
                  key={note.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography sx={{ color: '#fff' }}>{note.text}</Typography>
                  <Stack 
                    direction="row" 
                    spacing={0}
                    sx={{ 
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      mt: 1
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        setNewNoteText(note.text);
                        setEditingNoteId(note.id);
                      }}
                      sx={{ 
                        color: '#ED64A6',
                        borderRadius: 0,
                        flex: 1,
                        height: '36px',
                        '&:hover': {
                          bgcolor: 'rgba(237, 100, 166, 0.1)'
                        }
                      }}
                    >
                      <EditIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteNote(note.id)}
                      sx={{ 
                        color: '#ED64A6',
                        borderRadius: 0,
                        flex: 1,
                        height: '36px',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(237, 100, 166, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Photos Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#ff4081',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <PhotoLibraryIcon sx={{ fontSize: 18 }} />
            Admin Photos
          </Typography>

          <Paper sx={{ 
            bgcolor: '#242424',
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2
          }}>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                startIcon={<ImageIcon />}
                sx={{
                  backgroundColor: '#ff4081',
                  color: '#fff',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: '#f50057',
                  },
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {selectedPhoto ? selectedPhoto.name : 'Choose Photo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setSelectedPhoto(e.target.files[0])}
                />
              </Button>
              
              {selectedPhoto && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmitPhoto}
                  disabled={isSubmitting}
                  sx={{
                    mt: 1,
                    backgroundColor: '#2196f3',
                    color: '#fff',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#1976d2',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(33, 150, 243, 0.5)',
                    }
                  }}
                >
                  {isSubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Uploading...</span>
                    </Box>
                  ) : (
                    'Upload Photo'
                  )}
                </Button>
              )}
            </Box>

            {/* Photos Grid */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 2,
              mt: 2
            }}>
              {photos.map((photo) => (
                <Paper
                  key={photo.id}
                  elevation={2}
                  sx={{
                    position: 'relative',
                    paddingTop: '100%',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    backgroundColor: '#333',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={photo.url}
                    alt="Location photo"
                    loading="lazy"
                    onClick={() => setPreviewImage(photo)}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                  />
                  
                  {/* Overlay with actions */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      p: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease-in-out',
                      '&:hover': {
                        opacity: 1,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setPreviewImage(photo)}
                        sx={{
                          color: '#fff',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                          },
                          width: 30,
                          height: 30,
                        }}
                      >
                        <PreviewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(photo.url)}
                        sx={{
                          color: '#fff',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                          },
                          width: 30,
                          height: 30,
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteConfirm(photo)}
                        sx={{
                          color: '#fff',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,0,0,0.5)',
                          },
                          width: 30,
                          height: 30,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
              
              {/* Empty State */}
              {photos.length === 0 && (
                <Box
                  sx={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <PhotoLibraryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2">
                    No photos added yet
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    Upload photos to start building your collection
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Move Delete Button to bottom */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setDeleteLocationConfirmOpen(true)}
            startIcon={<DeleteIcon />}
            sx={{
              bgcolor: 'rgba(255, 51, 102, 0.1)',
              color: THEME_COLORS.accent,
              border: `1px solid ${THEME_COLORS.accent}40`,
              '&:hover': {
                bgcolor: 'rgba(255, 51, 102, 0.2)',
              },
              py: 1,
              borderRadius: 1.5
            }}
          >
            Delete Location
          </Button>
        </Box>
      </DialogContent>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            maxHeight: '90vh',
            maxWidth: '90vw',
          }
        }}
      >
        {previewImage && (
          <>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src={previewImage.url}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
              <IconButton
                onClick={() => setPreviewImage(null)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <DialogActions sx={{ p: 2, backgroundColor: '#1a1a1a' }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewImage.url)}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#fff',
          }
        }}
      >
        <DialogTitle>Delete Photo?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this photo? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePhoto}
            disabled={isDeleting}
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(255,0,0,0.5)',
              '&:hover': {
                backgroundColor: 'rgba(255,0,0,0.7)',
              },
            }}
          >
            {isDeleting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Deleting...</span>
              </Box>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Deletion Confirmation Dialog */}
      <Dialog
        open={deleteLocationConfirmOpen}
        onClose={() => setDeleteLocationConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#fff',
          }
        }}
      >
        <DialogTitle>Delete Location?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this location? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteLocationConfirmOpen(false)}
            sx={{
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteLocation}
            disabled={isDeletingLocation}
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(255,0,0,0.5)',
              '&:hover': {
                backgroundColor: 'rgba(255,0,0,0.7)',
              },
            }}
          >
            {isDeletingLocation ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Deleting...</span>
              </Box>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

AdminSidePanel.propTypes = {
  user: PropTypes.object,
  location: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  collections: PropTypes.array.isRequired,
  handleAddToCollection: PropTypes.func.isRequired,
  onCollectionUpdate: PropTypes.func,
  adminLocations: PropTypes.arrayOf(PropTypes.object),
  onDeleteLocation: PropTypes.func
};

export default AdminSidePanel;
