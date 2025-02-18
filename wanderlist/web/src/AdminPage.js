import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, doc, deleteDoc, getDocs, updateDoc, query, where, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  Fade,
  Card,
  CardContent,
  Stack,
  Divider,
  Grid,
  Avatar,
  Switch,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  LinearProgress,
  Badge,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemAvatar,
  ListItemIcon,
} from '@mui/material';
import {
  Delete,
  Edit,
  Person,
  Email,
  LocationOn,
  Close,
  Save,
  AdminPanelSettings,
  Dashboard,
  Group,
  TravelExplore,
  Assessment,
  Settings,
  Notifications,
  Search,
  FilterList,
  Sort,
  Download,
  Visibility,
  Block,
  PhotoCamera,
  Collections,
  NoteAlt,
  Place,
  VisibilityOff,
  Check,
  ExpandMore,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import PageLoader from './PageLoader';

// Match your homepage theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF3366',
    },
    background: {
      default: '#121212',
      paper: 'rgba(18, 18, 18, 0.95)',
    },
  },
});

const AdminPage = () => {
  // State hooks
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedUserData, setEditedUserData] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterBy, setFilterBy] = useState('all');
  const [userStats, setUserStats] = useState({
    total: 0,
    locations: 0,
    notes: 0,
    photos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionNotes, setCollectionNotes] = useState([]);
  const navigate = useNavigate();
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    isActive: true,
    profilePicture: '',
  });
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalNotes: 0,
    totalPhotos: 0,
    totalCollections: 0,
    totalCollectionNotes: 0
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [totalCollections, setTotalCollections] = useState(0);
  const [totalCollectionNotes, setTotalCollectionNotes] = useState(0);

  // Single useEffect for all data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Always fetch basic data
        await Promise.all([
          fetchUsers(),
          fetchStats()
        ]);
        
        // Conditionally fetch user-specific data
        if (selectedUser?.id) {
          await Promise.all([
            fetchUserStats(selectedUser.id),
            fetchCollections(selectedUser.id)
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ text: 'Error loading dashboard data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUser]); // Include selectedUser in dependencies

  // Move all your fetch functions here, after the hooks
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const adminEmails = ['mhabz1129@gmail.com'];
      
      const usersData = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(user => !adminEmails.includes(user.email));
      
      console.log('Filtered users:', usersData);
      setUsers(usersData);

      // Update stats to exclude admins
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length
      }));

    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ text: 'Error fetching users: ' + error.message, type: 'error' });
    }
  };

  const fetchStats = async () => {
    try {
      const [
        usersSnapshot,
        locationsSnapshot,
        notesSnapshot,
        photosSnapshot,
        collectionsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'locations')),
        getDocs(collection(db, 'notes')),
        getDocs(collection(db, 'photos')),
        getDocs(collection(db, 'collections'))
      ]);

      // Filter out admin from user count
      const adminEmails = ['mhabz1129@gmail.com'];
      const userCount = usersSnapshot.docs.filter(doc => 
        !adminEmails.includes(doc.data().email)
      ).length;

      // Get total notes in collections
      let totalNotesInCollections = 0;
      collectionsSnapshot.docs.forEach(doc => {
        totalNotesInCollections += doc.data().noteCount || 0;
      });

      setStats({
        totalUsers: userCount,
        totalLocations: locationsSnapshot.size,
        totalNotes: notesSnapshot.size,
        totalPhotos: photosSnapshot.size,
        totalCollections: collectionsSnapshot.size,
        totalCollectionNotes: totalNotesInCollections
      });

      console.log('Stats fetched:', {
        users: userCount,
        locations: locationsSnapshot.size,
        notes: notesSnapshot.size,
        photos: photosSnapshot.size,
        collections: collectionsSnapshot.size,
        collectionNotes: totalNotesInCollections
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMessage({ text: 'Error fetching statistics', type: 'error' });
    }
  };

  const fetchUserStats = async (userId) => {
    if (!userId) {
      console.warn('No userId provided for stats fetch');
      return;
    }

    try {
      // Create queries for user's content
      const locationsQuery = query(
        collection(db, 'locations'),
        where('userId', '==', userId)
      );
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId)
      );
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', userId)
      );

      // Execute all queries in parallel
      const [locationsSnap, notesSnap, photosSnap] = await Promise.all([
        getDocs(locationsQuery),
        getDocs(notesQuery),
        getDocs(photosQuery)
      ]);

      // Update user stats state
      setUserStats({
        locations: locationsSnap.size,
        notes: notesSnap.size,
        photos: photosSnap.size
      });

      console.log('User stats fetched:', {
        userId,
        locations: locationsSnap.size,
        notes: notesSnap.size,
        photos: photosSnap.size
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        locations: 0,
        notes: 0,
        photos: 0
      });
    }
  };

  const fetchCollections = async (userId) => {
    if (!userId) {
      setCollections([]);
      return;
    }

    try {
      const collectionsQuery = query(
        collection(db, 'collections'),
        where('userId', '==', userId)
      );
      const collectionsSnap = await getDocs(collectionsQuery);
      const collectionsData = collectionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const fetchCollectionNotes = async (collectionId) => {
    try {
      const notesQuery = query(
        collection(db, 'notes'),
        where('collectionId', '==', collectionId)
      );
      const notesSnap = await getDocs(notesQuery);
      const notesData = notesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCollectionNotes(notesData);
    } catch (error) {
      console.error('Error fetching collection notes:', error);
    }
  };

  // Event handlers and other functions
  const handleEditUser = (user) => {
    if (!user || !user.id) {
      console.error('Invalid user data in handleEditUser');
      return;
    }

    setSelectedUser(user);
    setEditedUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'user',
      isActive: user.isActive ?? false,
      location: user.location || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || '',
    });
    
    // Fetch stats after setting user data
    fetchUserStats(user.id);
    setEditMode(true);
  };

  const handleUpdateUser = async () => {
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const updateData = {
        firstName: editedUserData.firstName,
        lastName: editedUserData.lastName,
        email: editedUserData.email,
        phoneNumber: editedUserData.phoneNumber,
        bio: editedUserData.bio,
        location: editedUserData.location,
        updatedAt: new Date()
      };

      await updateDoc(userRef, updateData);
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...updateData } : user
      ));
      
      setMessage({ text: 'User updated successfully!', type: 'success' });
      setEditMode(false);
    } catch (error) {
      setMessage({ text: 'Error updating user: ' + error.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      console.log('Starting delete process for user:', userId);

      if (!userId) {
        throw new Error('No user ID provided');
      }

      // Call the Cloud Function with the correct parameter name
      const deleteUserFunction = httpsCallable(functions, 'deleteUser');
      const result = await deleteUserFunction({ uid: userId , userid: userId}); // Changed to uid to match function expectation
      
      console.log('Delete function result:', result.data);

      if (result.data.success) {
        // Update local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setMessage({ text: 'User deleted successfully!', type: 'success' });
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error(result.data.message || 'Failed to delete user');
      }

    } catch (error) {
      console.error('Delete user error:', error);
      setMessage({ 
        text: `Error deleting user: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserContent = async (userId, contentType) => {
    try {
      let collectionName;
      switch (contentType) {
        case 'locations':
          collectionName = 'locations';
          break;
        case 'notes':
          collectionName = 'notes';
          break;
        case 'photos':
          collectionName = 'photos';
          break;
        default:
          throw new Error('Invalid content type');
      }

      const contentQuery = query(
        collection(db, collectionName),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(contentQuery);
      
      await Promise.all(
        snapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      setMessage({ 
        text: `User's ${contentType} deleted successfully!`, 
        type: 'success' 
      });
      
      // Refresh user stats
      fetchUserStats(userId);
    } catch (error) {
      setMessage({ 
        text: `Error deleting user's ${contentType}: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = (option) => {
    if (typeof option === 'string') {
      setSortBy(option);
    }
    setSortAnchorEl(null);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = (option) => {
    if (typeof option === 'string') {
      setFilterBy(option);
    }
    setFilterAnchorEl(null);
  };

  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];

    // Apply filters
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive);
        break;
      case 'all':
      default:
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'recent':
          return (b.lastLogin?.toDate() || 0) - (a.lastLogin?.toDate() || 0);
        case 'oldest':
          return (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0);
        default:
          return 0;
      }
    });
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Location', 'Joined Date'],
      ...users.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        user.location,
        new Date(user.createdAt?.toDate()).toLocaleDateString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !isActive,
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ));
      setMessage({ 
        text: `User ${!isActive ? 'activated' : 'deactivated'} successfully!`, 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ 
        text: 'Error updating user status: ' + error.message, 
        type: 'error' 
      });
    }
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!newUserData.firstName || !newUserData.email || !newUserData.password) {
        setMessage({ text: 'Please fill in all required fields', type: 'error' });
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email,
        newUserData.password
      );

      // Prepare user data for Firestore
      // Set default role as 'user' if not specified
      const userData = {
        uid: userCredential.user.uid,
        firstName: newUserData.firstName,
        lastName: newUserData.lastName || '',
        email: newUserData.email,
        phoneNumber: newUserData.phoneNumber || '',
        profilePicture: newUserData.profilePicture || '',
        role: 'user', // Set default role
        isActive: newUserData.isActive ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add user to Firestore
      await addDoc(collection(db, 'users'), userData);

      // Reset form and show success message
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        isActive: true,
        profilePicture: '',
      });

      setMessage({ text: 'User added successfully!', type: 'success' });
      setAddUserDialogOpen(false);
      
      // Refresh users list
      await fetchUsers();

    } catch (error) {
      console.error('Error adding user:', error);
      setMessage({ 
        text: `Error adding user: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setUploadingImage(true);
      setMessage(null);

      // Create a storage reference
      const storageRef = ref(storage, `profilePictures/${selectedUser.id}/${file.name}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user document with new profile picture URL
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        profilePicture: downloadURL,
        updatedAt: new Date()
      });

      // Update local state
      setEditedUserData({
        ...editedUserData,
        profilePicture: downloadURL
      });

      setMessage({ text: 'Profile picture updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage({ text: 'Error uploading profile picture: ' + error.message, type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    return strength;
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setCollectionNotes(prev => prev.filter(note => note.id !== noteId));
      setMessage({ text: 'Note deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting note:', error);
      setMessage({ text: 'Error deleting note', type: 'error' });
    }
  };

  const handleExportData = async (type) => {
    try {
      setLoading(true);
      let data = [];

      switch (type) {
        case 'users':
          // Get all users data
          const usersSnapshot = await getDocs(collection(db, 'users'));
          data = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            lastLogin: doc.data().lastLogin?.toDate().toISOString()
          }));

          // Filter out sensitive information and admin users
          data = data
            .filter(user => user.email !== 'mhabz1129@gmail.com')
            .map(user => ({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin,
              isActive: user.isActive,
              totalLocations: user.totalLocations,
              totalNotes: user.totalNotes,
              totalPhotos: user.totalPhotos
            }));
          break;
        
        default:
          throw new Error('Invalid export type');
      }

      // Convert to CSV
      const csvContent = convertToCSV(data);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wanderlist_${type}_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ text: 'Data exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ text: 'Error exporting data: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [
        usersSnapshot,
        locationsSnapshot,
        notesSnapshot,
        photosSnapshot,
        collectionsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'locations')),
        getDocs(collection(db, 'notes')),
        getDocs(collection(db, 'photos')),
        getDocs(collection(db, 'collections'))
      ]);

      // Generate report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        statistics: {
          totalUsers: usersSnapshot.size,
          totalLocations: locationsSnapshot.size,
          totalNotes: notesSnapshot.size,
          totalPhotos: photosSnapshot.size,
          totalCollections: collectionsSnapshot.size,
        },
        userActivity: {
          activeUsers: usersSnapshot.docs.filter(doc => doc.data().isActive).length,
          newUsersThisMonth: usersSnapshot.docs.filter(doc => {
            const createdAt = doc.data().createdAt?.toDate();
            return createdAt && createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }).length,
        },
        contentGrowth: {
          locationsThisMonth: locationsSnapshot.docs.filter(doc => {
            const createdAt = doc.data().createdAt?.toDate();
            return createdAt && createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }).length,
          notesThisMonth: notesSnapshot.docs.filter(doc => {
            const createdAt = doc.data().createdAt?.toDate();
            return createdAt && createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }).length,
        }
      };

      // Convert to readable format
      const reportContent = JSON.stringify(reportData, null, 2);
      
      // Create and download file
      const blob = new Blob([reportContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wanderlist_report_${new Date().toISOString()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ text: 'Report generated successfully!', type: 'success' });
    } catch (error) {
      console.error('Report generation error:', error);
      setMessage({ text: 'Error generating report: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
      headers.map(header => 
        JSON.stringify(obj[header] ?? '')
      ).join(',')
    );
    
    return [
      headers.join(','),
      ...rows
    ].join('\n');
  };

  if (loading) {
    return <PageLoader message="Loading admin dashboard..." />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: { xs: 2, sm: 4 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <Container maxWidth="lg">
          {/* Header Section */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems="center" 
            justifyContent="space-between" 
            spacing={{ xs: 2, sm: 0 }}
            mb={{ xs: 3, sm: 4 }}
          >
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <AdminPanelSettings sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main' }} />
              <Typography 
                variant="h4" 
                color="primary.main"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
              >
                Admin Dashboard
              </Typography>
            </Stack>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                fullWidth={true}
                variant="contained"
                startIcon={<Person />}
                onClick={() => setAddUserDialogOpen(true)}
              >
                Add User
              </Button>
              <Button
                fullWidth={true}
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportUsers}
              >
                Export Users
              </Button>
            </Stack>
          </Stack>

          {/* Stats Cards */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'rgba(18, 18, 18, 0.95)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Group sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats.totalUsers}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'rgba(18, 18, 18, 0.95)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Place sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Total Locations
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats.totalLocations}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'rgba(18, 18, 18, 0.95)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <NoteAlt sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Total Notes
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats.totalNotes}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'rgba(18, 18, 18, 0.95)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <NoteAlt sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Collection Notes
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats.totalCollectionNotes}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'rgba(18, 18, 18, 0.95)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <PhotoCamera sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Total Photos
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats.totalPhotos}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Search and Filter Bar */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack 
                  direction="row" 
                  spacing={1}
                  sx={{ 
                    justifyContent: { xs: 'space-between', sm: 'flex-end' }
                  }}
                >
                  <Button
                    startIcon={<Sort />}
                    onClick={handleSortClick}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Sort By
                  </Button>
                  <Button
                    startIcon={<FilterList />}
                    onClick={handleFilterClick}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Filter
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Sort Menu */}
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => handleSortClose()}
          >
            <MenuItem onClick={() => handleSortClose('name')}>
              Name {sortBy === 'name' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleSortClose('email')}>
              Email {sortBy === 'email' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleSortClose('recent')}>
              Most Recent {sortBy === 'recent' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleSortClose('oldest')}>
              Oldest First {sortBy === 'oldest' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
          </Menu>

          {/* Filter Menu */}
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => handleFilterClose()}
          >
            <MenuItem onClick={() => handleFilterClose('all')}>
              All Users {filterBy === 'all' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterClose('active')}>
              Active Users {filterBy === 'active' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterClose('inactive')}>
              Inactive Users {filterBy === 'inactive' && <Check sx={{ ml: 1 }} />}
            </MenuItem>
          </Menu>

          {/* Users List */}
          <Paper 
            sx={{ 
              width: '100%', 
              mb: 2,
              overflow: 'hidden'
            }}
          >
            <List 
              sx={{ 
                p: 0,
                maxHeight: '60vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  margin: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 51, 102, 0.5)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(255, 51, 102, 0.7)'
                  }
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 51, 102, 0.5) rgba(255, 255, 255, 0.05)',
                msOverflowStyle: 'none',
              }}
            >
              {getFilteredAndSortedUsers().map((user) => (
                <ListItem
                  key={user.id}
                  divider
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 0 },
                    p: { xs: 2, sm: 1 }
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                      >
                        <Avatar 
                          src={user.profilePicture}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                  <Stack 
                    direction="row" 
                    spacing={1}
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end', sm: 'flex-end' }
                    }}
                  >
                    <IconButton
                      onClick={() => handleEditUser(user)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Container>
      </Box>

      {/* Enhanced Edit User Dialog */}
      <Dialog 
        open={editMode} 
        onClose={() => setEditMode(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
            minHeight: { xs: '100vh', sm: 'auto' },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
            borderRadius: { xs: 0, sm: 2 },
            position: 'relative',
            '& ::-webkit-scrollbar': {
              width: '8px',
              background: 'transparent'
            },
            '& ::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              margin: '4px'
            },
            '& ::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 51, 102, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(255, 51, 102, 0.7)'
              }
            }
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            p: { xs: 2, sm: 3 },
            bgcolor: 'background.paper',
            color: 'primary.main',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="h6">Edit User</Typography>
          <IconButton 
            onClick={() => setEditMode(false)}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              background: 'transparent'
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              margin: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 51, 102, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(255, 51, 102, 0.7)'
              }
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 51, 102, 0.5) rgba(255, 255, 255, 0.05)',
            msOverflowStyle: 'none',
          }}
        >
          {/* Profile Section */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <label htmlFor="profile-picture-upload">
                  <input
                    accept="image/*"
                    id="profile-picture-upload"
                    type="file"
                    hidden
                    onChange={handleProfilePictureUpload}
                  />
                  <IconButton
                    component="span"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 32,
                      height: 32
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 16 }} />
                  </IconButton>
                </label>
              }
            >
              <Avatar
                src={editedUserData.profilePicture}
                sx={{ 
                  width: { xs: 80, sm: 100 }, 
                  height: { xs: 80, sm: 100 },
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              />
            </Badge>
          </Box>

          {/* User Info Fields */}
          <Stack spacing={2}>
            <TextField
              label="First Name"
              value={editedUserData.firstName || ''}
              onChange={(e) => setEditedUserData({ ...editedUserData, firstName: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Last Name"
              value={editedUserData.lastName || ''}
              onChange={(e) => setEditedUserData({ ...editedUserData, lastName: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email"
              value={editedUserData.email || ''}
              onChange={(e) => setEditedUserData({ ...editedUserData, email: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Phone Number"
              value={editedUserData.phoneNumber || ''}
              onChange={(e) => setEditedUserData({ ...editedUserData, phoneNumber: e.target.value })}
              fullWidth
              variant="outlined"
            />
          </Stack>

          {/* Content Management */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Content Management
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ width: '100%' }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleDeleteUserContent(selectedUser.id, 'locations')}
                fullWidth
                size="small"
              >
                Delete All Locations
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleDeleteUserContent(selectedUser.id, 'notes')}
                fullWidth
                size="small"
              >
                Delete All Notes
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleDeleteUserContent(selectedUser.id, 'photos')}
                fullWidth
                size="small"
              >
                Delete All Photos
              </Button>
            </Stack>
          </Box>

          {/* User Statistics */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              User Statistics
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Joined: {selectedUser?.createdAt?.toDate().toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Active: {selectedUser?.lastLogin?.toDate().toLocaleDateString() || 'Never'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Locations: {userStats.locations || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Notes: {userStats.notes || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Photos: {userStats.photos || 0}
              </Typography>
            </Stack>
          </Box>

          {/* Collections & Notes */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Collections & Notes
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
              <Stack spacing={2}>
                {collections.map((collection) => (
                  <Accordion 
                    key={collection.id}
                    expanded={selectedCollection === collection.id}
                    onChange={() => {
                      setSelectedCollection(collection.id);
                      fetchCollectionNotes(collection.id);
                    }}
                    sx={{
                      bgcolor: 'background.default',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Collections color="primary" />
                        <Typography>{collection.name}</Typography>
                        <Chip 
                          label={`${collection.noteCount || 0} notes`}
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {collectionNotes.length > 0 ? (
                        <List dense sx={{ p: 0 }}>
                          {collectionNotes.map((note) => (
                            <ListItem 
                              key={note.id}
                              sx={{ 
                                borderLeft: '2px solid',
                                borderColor: 'primary.main',
                                pl: 2,
                                my: 1
                              }}
                            >
                              <ListItemText
                                primary={note.title}
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(note.createdAt?.toDate()).toLocaleDateString()}
                                  </Typography>
                                }
                              />
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          No notes in this collection
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
                {collections.length === 0 && (
                  <Typography color="text.secondary" align="center">
                    No collections found
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: { xs: 2, sm: 3 },
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            gap: 2
          }}
        >
          <Button 
            onClick={() => setEditMode(false)}
            variant="outlined"
            fullWidth
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser}
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user and all their content?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDeleteUser(selectedUser?.id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog 
        open={addUserDialogOpen} 
        onClose={() => setAddUserDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Profile Picture Upload */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Box position="relative" display="inline-block">
                <Avatar
                  src={newUserData.profilePicture}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    border: '2px solid #FF3366'
                  }}
                />
                <label htmlFor="new-profile-picture-upload">
                  <input
                    accept="image/*"
                    id="new-profile-picture-upload"
                    type="file"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setNewUserData({ ...newUserData, profilePicture: e.target.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: '#FF3366',
                      '&:hover': { bgcolor: '#FF1744' },
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="First Name"
                value={newUserData.firstName}
                onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={newUserData.lastName}
                onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={newUserData.phoneNumber}
                onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <LinearProgress
                variant="determinate"
                value={checkPasswordStrength(newUserData.password)}
                sx={{ 
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 
                      checkPasswordStrength(newUserData.password) <= 25 ? '#ff0000' :
                      checkPasswordStrength(newUserData.password) <= 50 ? '#ffa500' :
                      checkPasswordStrength(newUserData.password) <= 75 ? '#ffff00' : '#00ff00'
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Password strength: {
                  checkPasswordStrength(newUserData.password) <= 25 ? 'Weak' :
                  checkPasswordStrength(newUserData.password) <= 50 ? 'Fair' :
                  checkPasswordStrength(newUserData.password) <= 75 ? 'Good' : 'Strong'
                }
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={newUserData.confirmPassword}
                onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                fullWidth
                error={newUserData.password !== newUserData.confirmPassword && newUserData.confirmPassword !== ''}
                helperText={newUserData.password !== newUserData.confirmPassword && newUserData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newUserData.isActive}
                    onChange={(e) => setNewUserData({ ...newUserData, isActive: e.target.checked })}
                  />
                }
                label="Active Account"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained"
            disabled={
              !newUserData.email || 
              !newUserData.password || 
              !newUserData.firstName ||
              newUserData.password !== newUserData.confirmPassword ||
              checkPasswordStrength(newUserData.password) <= 25
            }
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Message */}
      {message && (
        <Fade in={Boolean(message)}>
          <Alert 
            severity={message.type} 
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        </Fade>
      )}
    </ThemeProvider>
  );
};

export default AdminPage;
