import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Typography,
  Box,
  ToggleButton,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addDoc, collection, updateDoc, doc, deleteDoc,getDoc,setDoc, onSnapshot, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Ensure Firebase Firestore is set up
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Firebase Storage for uploading images
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import NotesIcon from '@mui/icons-material/Notes';
import DeleteIcon from '@mui/icons-material/Delete';
import Zoom from '@mui/material/Zoom';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'react-hot-toast';

const SidePanel = ({
  user,
  location,
  onClose,
  collections,
  handleAddToCollection,
  onCollectionUpdate,
  adminLocations,
  onDeleteLocation,
  onLocationUpdate,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);
  const [adminPhotos, setAdminPhotos] = useState([]);
  const [isVisited, setIsVisited] = useState(location.visited || false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState(null);

  const locationId = location?.id;
  const isAdminLocation = location?.isCollectionLocation;

  useEffect(() => {
    if (!locationId || !user?.uid) return;

    const userNotesQuery = query(
      collection(db, 'notes'),
      where('locationId', '==', locationId),
      where('userId', '==', user.uid)
    );

    const userPhotosQuery = query(
      collection(db, 'photos'),
      where('locationId', '==', locationId),
      where('userId', '==', user.uid)
    );

    const adminNotesQuery = query(
      collection(db, 'adminNotes'),
      where('locationId', '==', locationId)
    );

    const adminPhotosQuery = query(
      collection(db, 'adminPhotos'),
      where('locationId', '==', locationId)
    );

    const unsubscribers = [];

    unsubscribers.push(
      onSnapshot(userNotesQuery, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserNotes(notes);
      })
    );

    unsubscribers.push(
      onSnapshot(userPhotosQuery, (snapshot) => {
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPhotos(photos);
      })
    );

    unsubscribers.push(
      onSnapshot(adminNotesQuery, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAdminNotes(notes);
      })
    );

    unsubscribers.push(
      onSnapshot(adminPhotosQuery, (snapshot) => {
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAdminPhotos(photos);
      })
    );

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [locationId, user?.uid]);

  const handleSubmitNote = async () => {
    if (!newNoteText || isSubmitting || !locationId || !user?.uid) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'notes'), {
        text: newNoteText,
        userId: user.uid,
        locationId,
        timestamp: new Date(),
      });
      setNewNoteText('');
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPhotos = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || isSubmitting || !locationId || !user?.uid) return;

    setIsSubmitting(true);
    try {
      // Upload all photos concurrently
      const uploadPromises = files.map(async (file) => {
        const storage = getStorage();
        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
        const storageRef = ref(storage, `user-photos/${user.uid}/${locationId}/${Date.now()}-${safeFileName}`);
        
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Add the photo reference to Firestore
        await addDoc(collection(db, 'photos'), {
          url,
          userId: user.uid,
          locationId,
          timestamp: new Date(),
          storagePath: storageRef.fullPath
        });
      });

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error adding photos:', error);
    } finally {
      setIsSubmitting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!noteId || !user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!photoId || !user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'photos', photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleDeleteLocation = async () => {
    console.log('Delete button clicked');
    console.log('Location ID:', location.id);
    console.log('User ID:', user?.uid);
    console.log('Is Admin Location:', isAdminLocation);

    if (!location.id || !user?.uid || isAdminLocation) {
      console.log('Delete cancelled because:', {
        hasLocationId: !!location.id,
        hasUserId: !!user?.uid,
        isAdminLocation: isAdminLocation
      });
      return;
    }

    try {
      console.log('Starting deletion process...');

      // Delete notes
      const notesQuery = query(
        collection(db, 'notes'),
        where('locationId', '==', location.id),
        where('userId', '==', user.uid)
      );
      const notesSnapshot = await getDocs(notesQuery);
      console.log('Found notes to delete:', notesSnapshot.size);

      const noteDeletePromises = notesSnapshot.docs.map(doc => {
        console.log('Deleting note:', doc.id);
        return deleteDoc(doc.ref);
      });
      await Promise.all(noteDeletePromises);

      // Delete photos
      const photosQuery = query(
        collection(db, 'photos'),
        where('locationId', '==', location.id),
        where('userId', '==', user.uid)
      );
      const photosSnapshot = await getDocs(photosQuery);
      console.log('Found photos to delete:', photosSnapshot.size);

      const photoDeletePromises = photosSnapshot.docs.map(async (doc) => {
        console.log('Deleting photo:', doc.id);
        const photoData = doc.data();
        if (photoData.storagePath) {
          const storage = getStorage();
          const photoRef = ref(storage, photoData.storagePath);
          try {
            await deleteObject(photoRef);
            console.log('Deleted photo from storage:', photoData.storagePath);
          } catch (error) {
            console.error('Error deleting photo from storage:', error);
          }
        }
        return deleteDoc(doc.ref);
      });
      await Promise.all(photoDeletePromises);

      // Delete location
      console.log('Deleting location document:', location.id);
      await deleteDoc(doc(db, 'locations', location.id));
      
      console.log('Location deleted successfully');
      
      // Close panel
      onClose();

      // Update parent component
      if (onDeleteLocation) {
        console.log('Calling onDeleteLocation callback');
        onDeleteLocation(location.id);
      } else {
        console.log('No onDeleteLocation callback provided');
      }

      toast.success('Location deleted successfully');

    } catch (error) {
      console.error('Error in deletion process:', error);
      toast.error('Failed to delete location');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleVisited = async () => {
    let newStatus = !isVisited;
    
    try {
      setIsVisited(newStatus);

      if (location.isCollectionLocation) {
        // Handle collection location
        const locationRef = doc(db, 'adminLocations', location.id);
        const updateData = {
          visited: newStatus,
          visitedAt: serverTimestamp(),
          visitedBy: user.uid
        };

        await updateDoc(locationRef, updateData);
      } else {
        // Handle user-generated location
        const locationRef = doc(db, 'locations', location.id);
        const updateData = {
          visited: newStatus,
          visitedAt: serverTimestamp(),
          visitedBy: user.uid
        };

        await updateDoc(locationRef, updateData);
      }

      // Notify parent component about the update
      if (typeof onLocationUpdate === 'function') {
        onLocationUpdate(location.id, {
          ...location,
          visited: newStatus,
          visitedAt: new Date(),
          visitedBy: user.uid,
          isCollectionLocation: location.isCollectionLocation
        });
      }
    } catch (error) {
      console.error('Error updating visit status:', error);
      setIsVisited(!newStatus); // Revert on error
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    // Handle Firestore Timestamp
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return 'Invalid Date';
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  if (!locationId || !user?.uid) {
    return null;
  }



  return (
    <>

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
          {/* Updated Header */}
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
                color: 'rgba(255, 255, 255, 0.6)', // textSecondary color
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
            backgroundColor: '#1a1a1a',
            // Custom scrollbar styling
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
            {/* Visit Button - Enhanced */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleToggleVisited}
              sx={{
                backgroundColor: '#ff4081',
                color: '#fff',
                py: 1.5,
                mb: 3,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#f50057',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 64, 129, 0.5)',
                }
              }}
            >
              {isVisited ? "✓ Visited" : "Mark as Visited"}
            </Button>

            {/* Admin Photos Section - Enhanced */}
            {adminPhotos.length > 0 && (
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
                  Location Photos ({adminPhotos.length})
                </Typography>
                
                <Paper sx={{ 
                  bgcolor: '#242424',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  p: 2
                }}>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(auto-fill, minmax(100px, 1fr))',
                      sm: 'repeat(auto-fill, minmax(130px, 1fr))',
                      md: 'repeat(auto-fill, minmax(150px, 1fr))'
                    },
                    gap: { xs: 1, sm: 1.5 },
                  }}>
                    {adminPhotos.map((photo) => (
                      <Paper
                        key={photo.id}
                        onClick={() => setSelectedPreviewPhoto(photo)}
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          backgroundColor: '#2a2a2a',
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          }
                        }}
                      >
                        <img
                          src={photo.url}
                          alt="Location"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Paper>
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Admin Notes Section - Enhanced */}
            {adminNotes.length > 0 && (
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
                  Location Notes
                </Typography>
                
                <Paper sx={{ 
                  bgcolor: '#242424',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  p: 2
                }}>
                  {adminNotes.map((note) => (
                    <Paper
                      key={note.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        borderRadius: 1,
                        borderLeft: '4px solid #ff4081',
                        '&:last-child': {
                          mb: 0
                        }
                      }}
                    >
                      <Typography>{note.text}</Typography>
                      {note.timestamp && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            mt: 1,
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}
                        >
                          Added {formatDate(note.timestamp)}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Paper>
              </Box>
            )}

            {/* Your Photos Section - Enhanced */}
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
                Your Photos ({userPhotos.length})
              </Typography>
              
              <Paper sx={{ 
                bgcolor: '#242424',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                p: 2
              }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(auto-fill, minmax(100px, 1fr))',
                    sm: 'repeat(auto-fill, minmax(130px, 1fr))',
                    md: 'repeat(auto-fill, minmax(150px, 1fr))'
                  },
                  gap: { xs: 1, sm: 1.5 },
                }}>
                  {userPhotos.map((photo) => (
                    <Paper
                      key={photo.id}
                      sx={{
                        position: 'relative',
                        paddingTop: '100%',
                        backgroundColor: '#2a2a2a',
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          '& .delete-button': {
                            opacity: 1
                          }
                        }
                      }}
                      onClick={() => setSelectedPreviewPhoto(photo)}
                    >
                      <img
                        src={photo.url}
                        alt="Location"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening preview when deleting
                          handleDeletePhoto(photo.id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 24,
                          height: 24,
                          padding: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          opacity: 0,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            transform: 'scale(1.1)',
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: 14
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  ))}
                  
                  {/* Updated Add Photos Button */}
                  <Paper
                    component="label"
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      backgroundColor: '#2a2a2a',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#ff4081',
                        '& .add-icon, & .add-text': {
                          color: '#ff4081'
                        }
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple // Enable multiple file selection
                      style={{ display: 'none' }}
                      onChange={handleSubmitPhotos}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <AddIcon 
                        className="add-icon" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)', 
                          fontSize: 24,
                          transition: 'color 0.2s'
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        className="add-text"
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          transition: 'color 0.2s',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          px: 1
                        }}
                      >
                        {isSubmitting ? 'Uploading...' : 'Add Photos'}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              </Paper>
            </Box>

            {/* Your Notes Section - Enhanced */}
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
                Your Notes
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
                  rows={3}
                  fullWidth
                  placeholder="Add a note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      backgroundColor: '#2a2a2a',
                      borderRadius: 1,
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff4081',
                      },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmitNote}
                  disabled={!newNoteText || isSubmitting}
                  sx={{
                    backgroundColor: '#ff4081',
                    color: '#fff',
                    mb: 2,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#f50057',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(255, 64, 129, 0.5)',
                    }
                  }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Note'}
                </Button>

                {userNotes.map((note) => (
                  <Paper
                    key={note.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      borderRadius: 1,
                      '&:last-child': {
                        mb: 0
                      }
                    }}
                  >
                    <Typography>{note.text}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        sx={{ 
                          color: '#ff4081',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 64, 129, 0.08)',
                          }
                        }}
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            p: 2, 
            backgroundColor: '#1a1a1a',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {!isAdminLocation && (
              <Button 
                onClick={handleDeleteLocation}
                sx={{ 
                  color: '#ff4081',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 64, 129, 0.08)'
                  }
                }}
              >
                Delete Location
              </Button>
            )}
          </DialogActions>
        </Dialog>
      

      {/* Enhanced Photo Preview Modal */}
      <Dialog
        open={!!selectedPreviewPhoto}
        onClose={() => setSelectedPreviewPhoto(null)}
        maxWidth="xl"
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            m: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            maxWidth: 'none',
          }
        }}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => setSelectedPreviewPhoto(null)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              padding: 0,
              color: '#fff',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
              '& .MuiSvgIcon-root': {
                fontSize: 18
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Download Button */}
          <IconButton
            onClick={() => handleDownload(selectedPreviewPhoto.url)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 60,
              width: 32,
              height: 32,
              padding: 0,
              color: '#fff',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
              '& .MuiSvgIcon-root': {
                fontSize: 18
              }
            }}
          >
            <DownloadIcon />
          </IconButton>

          {selectedPreviewPhoto && (
            <img
              src={selectedPreviewPhoto.url}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
};

const LocationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: '#1976d2',
  color: 'white',
}));

const WeatherCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  backgroundColor: '#fff',
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export default SidePanel;
