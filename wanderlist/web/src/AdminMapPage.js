import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Fade,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Collections as CollectionsIcon,
  CenterFocusStrong as CenterFocusStrongIcon
} from '@mui/icons-material';
import { collection, doc, getDocs, addDoc, deleteDoc, query, where, updateDoc, getDoc, arrayUnion, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import AdminSidePanel from './AdminSidePanel';
import { motion } from 'framer-motion';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { debounce } from 'lodash';

const THEME_COLORS = {
  primary: '#1B5E20',
  accent: '#FF3366',
  background: 'rgba(18, 18, 18, 0.95)',
  text: '#FFFFFF',
};

const ADMIN_EMAIL = 'mhabz1129@gmail.com';

const AdminMapPage = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [adminLocations, setAdminLocations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [collections, setCollections] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [editingCollectionId, setEditingCollectionId] = useState(null);
    const [editingCollectionName, setEditingCollectionName] = useState('');
    const [selectedCollectionLocations, setSelectedCollectionLocations] = useState([]);
    const [expandedCollection, setExpandedCollection] = useState(null);
    const navigate = useNavigate();
    const [collectionLocations, setCollectionLocations] = useState({});
    const [expandedCollectionLocations, setExpandedCollectionLocations] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteLocationConfirmOpen, setDeleteLocationConfirmOpen] = useState(false);
    const [editConfirmOpen, setEditConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [removeFromCollectionConfirmOpen, setRemoveFromCollectionConfirmOpen] = useState(false);
    const deletedLocations = useRef(new Set());
    const deletionInProgress = useRef(new Set());

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    const persistDeletedLocation = (locationId) => {
        deletedLocations.current.add(locationId);
        try {
            const storedDeletedLocations = JSON.parse(localStorage.getItem('deletedLocations') || '[]');
            if (!storedDeletedLocations.includes(locationId)) {
                storedDeletedLocations.push(locationId);
                localStorage.setItem('deletedLocations', JSON.stringify(storedDeletedLocations));
            }
        } catch (error) {
            console.error('Error persisting deleted location:', error);
        }
    };

    const debouncedDelete = useRef(
        debounce(async (locationId) => {
            if (deletionInProgress.current.has(locationId)) {
                console.log('❌ Deletion already in progress for:', locationId);
                return;
            }

            try {
                deletionInProgress.current.add(locationId);
                console.log('🚀 Starting deletion process for location:', locationId);

                // Persist to deleted locations first
                persistDeletedLocation(locationId);
                
                // Delete from Firestore
                console.log('1️⃣ Deleting from Firestore...');
                const locationRef = doc(db, 'adminLocations', locationId);
                await deleteDoc(locationRef);
                
                // Double-check deletion
                const checkDoc = await getDoc(locationRef);
                if (checkDoc.exists()) {
                    console.log('⚠️ Location still exists, attempting force delete...');
                    await deleteDoc(locationRef);
                }
                
                // Remove from collections
                console.log('2️⃣ Removing from collections...');
                const collectionsSnapshot = await getDocs(collection(db, 'adminCollections'));
                const updatePromises = collectionsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    if (data.locationIds?.includes(locationId)) {
                        return updateDoc(doc.ref, {
                            locationIds: data.locationIds.filter(id => id !== locationId),
                            lastModified: serverTimestamp()
                        });
                    }
                    return Promise.resolve();
                });
                await Promise.all(updatePromises);

                // Update UI and clear markers
                console.log('3️⃣ Updating UI...');
                clearMarkers();
                setIsPanelOpen(false);
                setSelectedLocation(null);
                setDeleteLocationConfirmOpen(false);

                // Update local state
                setAdminLocations(prev => prev.filter(loc => loc.id !== locationId));
                setSelectedCollectionLocations(prev => prev.filter(loc => loc.id !== locationId));

                // Refresh locations
                console.log('4️⃣ Refreshing locations...');
                const locationsSnapshot = await getDocs(collection(db, 'adminLocations'));
                const validLocations = locationsSnapshot.docs
                    .filter(doc => !deletedLocations.current.has(doc.id))
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                setAdminLocations(validLocations);
                validLocations.forEach(location => addMarkerToMap(location));

                console.log('✅ Deletion completed successfully for:', locationId);
            } catch (error) {
                console.error('❌ Error during deletion:', error);
            } finally {
                deletionInProgress.current.delete(locationId);
            }
        }, 500, { leading: true, trailing: false })
    ).current;

    useEffect(() => {
        if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) return;

        // Load deleted locations from localStorage
        try {
            const storedDeletedLocations = JSON.parse(localStorage.getItem('deletedLocations') || '[]');
            storedDeletedLocations.forEach(id => deletedLocations.current.add(id));
        } catch (error) {
            console.error('Error loading deleted locations:', error);
        }

        const unsubscribe = onSnapshot(
            collection(db, 'adminLocations'),
            (snapshot) => {
                if (deletionInProgress.current.size === 0) {
                    const validLocations = snapshot.docs
                        .filter(doc => !deletedLocations.current.has(doc.id))
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                    clearMarkers();
                    setAdminLocations(validLocations);
                    validLocations.forEach(location => addMarkerToMap(location));
                }
            }
        );

        return () => {
            unsubscribe();
            debouncedDelete.cancel();
        };
    }, [auth.currentUser]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (!user || user.email !== ADMIN_EMAIL) {
                navigate('/');
                return;
            }

            const fetchAdminData = async () => {
                try {
                    const locationsSnapshot = await getDocs(collection(db, 'adminLocations'));
                    const collectionsSnapshot = await getDocs(collection(db, 'adminCollections'));

                    const locationsData = locationsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    const collectionsData = collectionsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    setAdminLocations(locationsData);
                    setCollections(collectionsData);

                    if (mapRef.current && !mapInstanceRef.current) {
                        initializeMap();
                    }

                    locationsData.forEach(location => addMarkerToMap(location));
                } catch (error) {
                    console.error("Error fetching admin data:", error);
                }
            };

            fetchAdminData();
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    useEffect(() => {
        // Update collections to remove any references to deleted locations
        setCollections(prevCollections => 
            prevCollections.map(collection => ({
                ...collection,
                locationIds: collection.locationIds?.filter(id => 
                    adminLocations.some(loc => loc.id === id)
                ) || []
            }))
        );
    }, [adminLocations]);

    useEffect(() => {
        if (!expandedCollection) {
            // When no collection is expanded, show all locations
            clearMarkers();
            adminLocations.forEach(location => addMarkerToMap(location));
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'adminCollections', expandedCollection),
            async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const { locationIds = [] } = docSnapshot.data();
                    
                    const validLocationIds = locationIds.filter(id => 
                        adminLocations.some(loc => loc.id === id)
                    );

                    if (validLocationIds.length !== locationIds.length) {
                        await updateDoc(doc(db, 'adminCollections', expandedCollection), {
                            locationIds: validLocationIds
                        });
                        return;
                    }

                    try {
                        const locationsSnapshot = await getDocs(
                            query(
                                collection(db, 'adminLocations'),
                                where('__name__', 'in', validLocationIds)
                            )
                        );

                        const validLocations = locationsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                        clearMarkers();
                        setSelectedCollectionLocations(validLocations);
                        
                        validLocations.forEach(location => addMarkerToMap(location));
                    } catch (error) {
                        console.error("Error fetching collection locations:", error);
                    }
                }
            }
        );

        return () => unsubscribe();
    }, [expandedCollection, adminLocations]);

    const initializeMap = () => {
        const platform = new window.H.service.Platform({
            apikey: "zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ",
        });
        const defaultLayers = platform.createDefaultLayers();
        const map = new window.H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
                center: { lat: 55.8642, lng: -4.2518 },
                zoom: 13,
            }
        );
        new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        window.H.ui.UI.createDefault(map, defaultLayers);
        mapInstanceRef.current = map;
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        const newCollectionRef = await addDoc(collection(db, 'adminCollections'), { 
            name: newCollectionName, 
            locationIds: [],
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
        });
        setCollections([...collections, { 
            id: newCollectionRef.id, 
            name: newCollectionName, 
            locationIds: [],
            createdAt: new Date(),
            lastModified: new Date()
        }]);
        setNewCollectionName('');
    };

    const handleEditCollection = async (collectionId) => {
        if (!editingCollectionName.trim()) return;
        try {
            const collectionRef = doc(db, 'adminCollections', collectionId);
            await updateDoc(collectionRef, { 
                name: editingCollectionName,
                lastModified: serverTimestamp()
            });
            setCollections(collections.map(col => col.id === collectionId ? { 
                ...col, 
                name: editingCollectionName,
                lastModified: new Date()
            } : col));
            setEditingCollectionId(null);
            setEditingCollectionName('');
            setEditConfirmOpen(false);
        } catch (error) {
            console.error("Error editing collection:", error);
        }
    };

    const handleDeleteCollection = async (collectionId) => {
        try {
            await deleteDoc(doc(db, 'adminCollections', collectionId));
            setCollections(collections.filter(col => col.id !== collectionId));
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error("Error deleting collection:", error);
        }
    };

    const handleAddToCollection = async (collectionId, locationId) => {
        try {
            console.log('Adding location to collection:', { collectionId, locationId });
            
            // First, ensure the location exists in adminLocations
            if (locationId.startsWith('here:')) {
                const locationRef = doc(db, 'adminLocations', locationId);
                const locationDoc = await getDoc(locationRef);
                
                if (!locationDoc.exists()) {
                    // Save the HERE location details
                    const location = adminLocations.find(loc => loc.id === locationId);
                    if (location) {
                        await setDoc(locationRef, {
                            address: location.address || location.title,
                            title: location.title,
                            lat: location.lat,
                            lng: location.lng,
                            timestamp: new Date(),
                            type: 'here'
                        });
                    }
                }
            }

            // Then add to collection
            const collectionRef = doc(db, 'adminCollections', collectionId);
            await updateDoc(collectionRef, {
                locationIds: arrayUnion(locationId),
                lastModified: serverTimestamp()
            });
            
            // Update local state
            setCollections(prev => prev.map(col => 
                col.id === collectionId ? {
                    ...col,
                    locationIds: [...(col.locationIds || []), locationId],
                    lastModified: new Date()
                } : col
            ));
            
            console.log('Successfully added location to collection');
        } catch (error) {
            console.error('Error adding to collection:', error);
        }
    };

    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value) {
            const platform = new window.H.service.Platform({
                apikey: "zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ",
            });
            const service = platform.getSearchService();

            service.autosuggest(
                { 
                    q: value,
                    at: `${55.8642},${-4.2518}`
                },
                (result) => {
                    setSearchResults(result.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        position: item.position
                    })));
                },
                (error) => {
                    console.error('Error fetching location suggestions:', error);
                }
            );
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectLocation = async (location) => {
        const user = auth.currentUser;
        if (user?.email !== 'mhabz1129@gmail.com') return;

        const newLocation = {
            title: location.title,
            lat: location.position.lat,
            lng: location.position.lng,
            id: location.id,
        };

        const docRef = await addDoc(collection(db, 'adminLocations'), newLocation);
        newLocation.id = docRef.id;
        setAdminLocations(prev => [...prev, newLocation]);
        addMarkerToMap(newLocation);
        
        // Center map on new location
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({
                lat: newLocation.lat,
                lng: newLocation.lng
            });
            mapInstanceRef.current.setZoom(15); // Adjust zoom level as needed
        }
        
        setSearchResults([]);
        setSearchTerm('');
    };

    const addMarkerToMap = (location) => {
        if (!mapInstanceRef.current || deletedLocations.current.has(location.id)) return;

        const marker = new window.H.map.Marker({
            lat: location.lat,
            lng: location.lng
        });

        marker.locationId = location.id;
        mapInstanceRef.current.addObject(marker);
        markersRef.current.push(marker);

        marker.addEventListener('tap', () => {
            if (!deletedLocations.current.has(location.id)) {
                setSelectedLocation(location);
                setIsPanelOpen(true);
            }
        });
    };

    const clearMarkers = () => {
        if (mapInstanceRef.current && markersRef.current.length > 0) {
            markersRef.current.forEach(marker => {
                mapInstanceRef.current.removeObject(marker);
            });
            markersRef.current = [];
        }
    };

    const handleCollectionClick = async (locationIds = []) => {
        try {
            clearMarkers();

            const locations = [];
            for (const id of locationIds) {
                const locationDoc = await getDoc(doc(db, 'adminLocations', id));
                if (locationDoc.exists()) {
                    const location = { id: locationDoc.id, ...locationDoc.data() };
                    locations.push(location);
                    const marker = new window.H.map.Marker({
                        lat: location.lat,
                        lng: location.lng
                    });
                    marker.locationId = location.id;
                    marker.addEventListener('tap', () => {
                        setSelectedLocation(location);
                        setIsPanelOpen(true);
                    });
                    mapInstanceRef.current.addObject(marker);
                    markersRef.current.push(marker);
                }
            }

            setSelectedCollectionLocations(locations);

            if (locations.length > 0) {
                mapInstanceRef.current.setCenter({
                    lat: locations[0].lat,
                    lng: locations[0].lng
                });
                mapInstanceRef.current.setZoom(13);
            }
        } catch (error) {
            console.error("Error handling collection click:", error);
        }
    };

    // Add this helper function
    const removeLocationFromAllCollections = async (locationId) => {
        try {
            // Get all collections that contain this location
            const collectionsSnapshot = await getDocs(collection(db, 'adminCollections'));
            const updatePromises = collectionsSnapshot.docs.map(async (collectionDoc) => {
                const locationIds = collectionDoc.data().locationIds || [];
                if (locationIds.includes(locationId)) {
                    await updateDoc(collectionDoc.ref, {
                        locationIds: locationIds.filter(id => id !== locationId)
                    });
                }
            });
            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error removing location from collections:', error);
            throw error; // Propagate error to handle it in the main deletion function
        }
    };

    // Update the handleLocationDelete function
    const handleLocationDelete = (locationId) => {
        if (deletionInProgress.current.has(locationId)) {
            console.log('❌ Deletion already in progress for:', locationId);
            return;
        }
        debouncedDelete(locationId);
    };

    const handleRemoveFromCollection = async (collectionId, locationId) => {
        try {
            const collectionRef = doc(db, 'adminCollections', collectionId);
            const collectionDoc = await getDoc(collectionRef);
            
            if (!collectionDoc.exists()) return;

            const currentLocationIds = collectionDoc.data().locationIds || [];
            
            await updateDoc(collectionRef, {
                locationIds: currentLocationIds.filter(id => id !== locationId),
                lastModified: serverTimestamp()
            });

            // Update local state
            setCollections(prev => prev.map(col => {
                if (col.id === collectionId) {
                    return {
                        ...col,
                        locationIds: col.locationIds.filter(id => id !== locationId),
                        lastModified: new Date()
                    };
                }
                return col;
            }));

            // If this is the currently expanded collection, update the view
            if (expandedCollection === collectionId) {
                // Remove marker from map
                const markerToRemove = markersRef.current.find(marker => marker.locationId === locationId);
                if (markerToRemove && mapInstanceRef.current) {
                    mapInstanceRef.current.removeObject(markerToRemove);
                    markersRef.current = markersRef.current.filter(marker => marker.locationId !== locationId);
                }

                // Update selected locations
                setSelectedCollectionLocations(prev => 
                    prev.filter(loc => loc.id !== locationId)
                );
            }

            setRemoveFromCollectionConfirmOpen(false);
            console.log('Successfully removed location from collection');
        } catch (error) {
            console.error("Error removing location from collection:", error);
        }
    };

    const handleViewCollectionLocations = async (locationIds = []) => {
        try {
            const locations = [];
            for (const id of locationIds) {
                const locationDoc = await getDoc(doc(db, 'adminLocations', id));
                if (locationDoc.exists()) {
                    locations.push({ id: locationDoc.id, ...locationDoc.data() });
                }
            }
            setSelectedCollectionLocations(locations);
        } catch (error) {
            console.error("Error fetching collection locations:", error);
            setSelectedCollectionLocations([]);
        }
    };

    // Add this function to handle collection updates
    const handleCollectionUpdate = (collectionId, locations) => {
        // Update markers on the map
        clearMarkers();
        
        locations.forEach(location => {
            const marker = new window.H.map.Marker({
                lat: location.lat,
                lng: location.lng
            });
            marker.locationId = location.id;
            marker.addEventListener('tap', () => {
                setSelectedLocation(location);
                setIsPanelOpen(true);
            });
            if (mapInstanceRef.current) {
                mapInstanceRef.current.addObject(marker);
                markersRef.current.push(marker);
            }
        });

        // Update the collection locations state
        setSelectedCollectionLocations(locations);
    };

    // Add real-time listener for collections
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'adminCollections'),
            async (snapshot) => {
                const updates = {};
                
                // Process each collection change
                for (const change of snapshot.docChanges()) {
                    const collectionData = { id: change.doc.id, ...change.doc.data() };
                    
                    if (collectionData.locationIds?.length > 0) {
                        // Fetch all locations for this collection
                        const locationPromises = collectionData.locationIds.map(async (locationId) => {
                            const locationDoc = await getDoc(doc(db, 'adminLocations', locationId));
                            if (locationDoc.exists()) {
                                return { id: locationDoc.id, ...locationDoc.data() };
                            }
                            return null;
                        });

                        const locations = (await Promise.all(locationPromises)).filter(loc => loc !== null);
                        updates[change.doc.id] = locations;

                        // Update markers if this is the currently viewed collection
                        if (expandedCollection === change.doc.id) {
                            updateMapMarkers(locations);
                        }
                    } else {
                        updates[change.doc.id] = [];
                    }
                }

                // Update state with new locations
                setCollectionLocations(prev => ({
                    ...prev,
                    ...updates
                }));
            }
        );

        return () => unsubscribe();
    }, []);

    // Add function to update map markers
    const updateMapMarkers = (locations) => {
        // Clear existing markers
        clearMarkers();
        
        // Add new markers
        locations.forEach(location => {
            const marker = new window.H.map.Marker({
                lat: location.lat,
                lng: location.lng
            });
            marker.locationId = location.id;
            marker.addEventListener('tap', () => {
                setSelectedLocation(location);
                setIsPanelOpen(true);
            });
            if (mapInstanceRef.current) {
                mapInstanceRef.current.addObject(marker);
                markersRef.current.push(marker);
            }
        });
    };

    // Add this function to handle collection expansion
    const handleCollectionExpand = (collectionId) => {
        setExpandedCollection(collectionId);
        if (collectionLocations[collectionId]) {
            updateMapMarkers(collectionLocations[collectionId]);
        }
    };

    // Add this function to get location details
    const getLocationDetails = async (locationId) => {
        try {
            const locationRef = doc(db, 'adminLocations', locationId);
            const locationDoc = await getDoc(locationRef);
            
            if (locationDoc.exists()) {
                const data = locationDoc.data();
                return {
                    id: locationId,
                    address: data.address,
                    title: data.address || data.title,
                    lat: data.lat,
                    lng: data.lng
                };
            }
            
            // If not found in adminLocations, check if it's a HERE location
            if (locationId.startsWith('here:')) {
                // You might want to implement HERE API call here to get location details
                // For now, return basic info
                return {
                    id: locationId,
                    address: locationId,
                    title: locationId.includes('place') ? 'HERE Place' : 'HERE Street',
                    lat: null,
                    lng: null
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting location details:', error);
            return null;
        }
    };

    // Update the useEffect for collection locations
    useEffect(() => {
        if (!expandedCollection) return;

        const unsubscribe = onSnapshot(
            doc(db, 'adminCollections', expandedCollection),
            async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const { locationIds = [] } = docSnapshot.data();
                    
                    const locationPromises = locationIds.map(getLocationDetails);
                    const locations = await Promise.all(locationPromises);
                    const validLocations = locations.filter(loc => loc !== null);
                    
                    setSelectedCollectionLocations(validLocations);
                    updateMapMarkers(validLocations);
                }
            }
        );

        return () => unsubscribe();
    }, [expandedCollection]);

    const handleSearchResult = (result) => {
        const location = {
            id: result.id,
            title: result.title || result.address || 'Unnamed Location',
            address: result.address || result.title || 'Unnamed Location',
            lat: result.position?.lat || result.lat,
            lng: result.position?.lng || result.lng
        };
        
        setSelectedLocation(location);
        setIsPanelOpen(true);
    };

    // Update the handleLocationUpdate function
    const handleLocationUpdate = async (locationId, updatedData) => {
        try {
            const locationRef = doc(db, 'adminLocations', locationId);
            await updateDoc(locationRef, {
                ...updatedData,
                lastUpdated: serverTimestamp()
            });
            
            // Local state update
            setAdminLocations(prevLocations =>
                prevLocations.map(loc =>
                    loc.id === locationId ? { ...loc, ...updatedData } : loc
                )
            );
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                pt: 4,
                pb: 8
            }}
        >
            <Container maxWidth="xl">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            color: THEME_COLORS.text,
                            mb: 4,
                            textAlign: 'center',
                            fontWeight: 600,
                            background: 'linear-gradient(45deg, #FF3366, #FF8C00)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Admin Map Dashboard
                    </Typography>

                    <Paper 
                        elevation={0}
                        sx={{
                            position: 'relative',
                            height: '600px',
                            mb: 4,
                            bgcolor: 'rgba(18, 18, 18, 0.8)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '80%',
                                    maxWidth: 500,
                                    zIndex: 10
                                }}
                            >
                                <TextField
                                    fullWidth
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search for a location"
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />,
                                        sx: {
                                            bgcolor: 'rgba(0,0,0,0.7)',
                                            backdropFilter: 'blur(10px)',
                                            color: 'white',
                                            '& fieldset': {
                                                borderColor: 'rgba(255,255,255,0.2)'
                                            }
                                        }
                                    }}
                                />
                                
                                <Fade in={searchResults.length > 0}>
                                    <Paper
                                        sx={{
                                            mt: 1,
                                            bgcolor: 'rgba(0,0,0,0.9)',
                                            backdropFilter: 'blur(10px)',
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }}
                                    >
                                        <List>
                                            {searchResults.map((result) => (
                                                <ListItem
                                                    key={result.id}
                                                    button
                                                    onClick={() => handleSelectLocation(result)}
                                                    sx={{
                                                        color: 'white',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255,255,255,0.1)'
                                                        }
                                                    }}
                                                >
                                                    <ListItemText primary={result.title} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                </Fade>
                            </Box>
                        </div>
                    </Paper>

                    <motion.div variants={itemVariants}>
                        <Paper
                            sx={{
                                p: 3,
                                bgcolor: 'rgba(18, 18, 18, 0.8)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="New collection name"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': {
                                                borderColor: 'rgba(255,255,255,0.2)'
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleCreateCollection}
                                    startIcon={<AddIcon />}
                                    sx={{
                                        bgcolor: THEME_COLORS.accent,
                                        '&:hover': {
                                            bgcolor: '#FF1744'
                                        }
                                    }}
                                >
                                    Add Collection
                                </Button>
                            </Stack>

                            {collections.map((col) => (
                                <Accordion
                                    key={col.id}
                                    expanded={expandedCollection === col.id}
                                    onChange={(_, isExpanded) => {
                                        if (isExpanded) {
                                            setExpandedCollection(col.id);
                                        } else {
                                            setExpandedCollection(null);
                                            clearMarkers();
                                            // Add all locations back to the map
                                            adminLocations.forEach(location => addMarkerToMap(location));
                                            setSelectedCollectionLocations([]);
                                        }
                                    }}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        mb: 1,
                                        '&:before': {
                                            display: 'none',
                                        },
                                        '& .MuiAccordionSummary-root': {
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        }
                                    }}
                                >
                                    <AccordionSummary 
                                        expandIcon={
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    color: THEME_COLORS.accent,
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,51,102,0.1)',
                                                    },
                                                    p: 0.5,
                                                    mr: -1,
                                                }}
                                            >
                                                <ExpandMoreIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        }
                                        sx={{
                                            '& .MuiAccordionSummary-expandIconWrapper': {
                                                marginRight: -1,
                                            }
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            sx={{ width: '100%' }}
                                        >
                                            <CollectionsIcon sx={{ color: THEME_COLORS.accent }} />
                                            <Box sx={{ flex: 1 }}>
                                                {editingCollectionId === col.id ? (
                                                    <TextField
                                                        value={editingCollectionName}
                                                        onChange={(e) => setEditingCollectionName(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                setPendingAction(col.id);
                                                                setEditConfirmOpen(true);
                                                            }
                                                        }}
                                                        autoFocus
                                                        size="small"
                                                        sx={{
                                                            width: '100%',
                                                            '& .MuiInputBase-input': { color: 'white' }
                                                        }}
                                                    />
                                                ) : (
                                                    <Stack spacing={0.5}>
                                                        <Typography sx={{ fontWeight: 500 }}>{col.name}</Typography>
                                                        <Stack 
                                                            direction="row" 
                                                            spacing={2} 
                                                            sx={{ 
                                                                color: 'rgba(255,255,255,0.6)',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            <Typography variant="caption">
                                                                {col.locationIds?.length || 0} locations
                                                            </Typography>
                                                            {col.createdAt && (
                                                                <Typography variant="caption">
                                                                    Created: {col.createdAt instanceof Date 
                                                                        ? col.createdAt.toLocaleDateString() 
                                                                        : new Date(col.createdAt.seconds * 1000).toLocaleDateString()}
                                                                </Typography>
                                                            )}
                                                            {col.lastModified && (
                                                                <Typography variant="caption">
                                                                    Modified: {col.lastModified instanceof Date 
                                                                        ? col.lastModified.toLocaleDateString() 
                                                                        : new Date(col.lastModified.seconds * 1000).toLocaleDateString()}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Stack>
                                                )}
                                            </Box>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Tooltip title="Edit Collection Name">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingCollectionId(col.id);
                                                            setEditingCollectionName(col.name);
                                                        }}
                                                        sx={{
                                                            color: THEME_COLORS.accent,
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255,51,102,0.1)',
                                                            },
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Collection">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPendingAction(col.id);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        sx={{
                                                            color: THEME_COLORS.accent,
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255,51,102,0.1)',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List>
                                            {selectedCollectionLocations.map((loc) => (
                                                <ListItem
                                                    key={loc.id}
                                                    sx={{
                                                        bgcolor: 'rgba(255,255,255,0.03)',
                                                        mb: 1,
                                                        borderRadius: 1,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255,255,255,0.05)',
                                                        }
                                                    }}
                                                    secondaryAction={
                                                        <Stack direction="row" spacing={0.5}>
                                                            <Tooltip title="Center on Map">
                                                                <IconButton
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (mapInstanceRef.current) {
                                                                            mapInstanceRef.current.setCenter({
                                                                                lat: loc.lat,
                                                                                lng: loc.lng
                                                                            });
                                                                            mapInstanceRef.current.setZoom(15);
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                    sx={{ 
                                                                        color: THEME_COLORS.accent,
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '50%',
                                                                        '&:hover': {
                                                                            bgcolor: 'rgba(255,51,102,0.1)',
                                                                        },
                                                                    }}
                                                                >
                                                                    <CenterFocusStrongIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Remove from Collection">
                                                                <IconButton
                                                                    edge="end"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPendingAction({ collectionId: col.id, locationId: loc.id });
                                                                        setRemoveFromCollectionConfirmOpen(true);
                                                                    }}
                                                                    size="small"
                                                                    sx={{ 
                                                                        color: THEME_COLORS.accent,
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '50%',
                                                                        '&:hover': {
                                                                            bgcolor: 'rgba(255,51,102,0.1)',
                                                                        },
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 500 }}>
                                                                {loc.title}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                    {loc.address || 'No address available'}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                                    Lat: {loc.lat.toFixed(4)} • Lng: {loc.lng.toFixed(4)}
                                                                </Typography>
                                                                {loc.timestamp && (
                                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                                        Added: {new Date(loc.timestamp.toDate()).toLocaleDateString()}
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        }
                                                        sx={{
                                                            '& .MuiListItemText-primary': {
                                                                color: 'white'
                                                            },
                                                            '& .MuiListItemText-secondary': {
                                                                color: 'rgba(255,255,255,0.7)'
                                                            }
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                            {selectedCollectionLocations.length === 0 && (
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ 
                                                        color: 'rgba(255,255,255,0.5)',
                                                        textAlign: 'center',
                                                        py: 2
                                                    }}
                                                >
                                                    No locations in this collection
                                                </Typography>
                                            )}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Paper>
                    </motion.div>
                </motion.div>
            </Container>

            {isPanelOpen && selectedLocation && (
                <AdminSidePanel
                    user={auth.currentUser}
                    location={selectedLocation}
                    onClose={() => setIsPanelOpen(false)}
                    collections={collections}
                    handleAddToCollection={handleAddToCollection}
                    onCollectionUpdate={handleCollectionUpdate}
                    onDeleteLocation={handleLocationDelete}
                    adminLocations={adminLocations}
                />
            )}

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: THEME_COLORS.background,
                        color: THEME_COLORS.text,
                        border: `1px solid ${THEME_COLORS.accent}40`
                    }
                }}
            >
                <DialogTitle sx={{ color: THEME_COLORS.text }}>
                    Confirm Collection Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Are you sure you want to delete this collection? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteConfirmOpen(false)}
                        sx={{ color: THEME_COLORS.text }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleDeleteCollection(pendingAction)}
                        sx={{ 
                            color: THEME_COLORS.accent,
                            '&:hover': {
                                bgcolor: `${THEME_COLORS.accent}20`
                            }
                        }}
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteLocationConfirmOpen}
                onClose={() => setDeleteLocationConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: THEME_COLORS.background,
                        color: THEME_COLORS.text,
                        border: `1px solid ${THEME_COLORS.accent}40`
                    }
                }}
            >
                <DialogTitle sx={{ color: THEME_COLORS.text }}>
                    Confirm Location Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Are you sure you want to delete this location? This will remove it from all collections and delete associated data. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteLocationConfirmOpen(false)}
                        sx={{ color: THEME_COLORS.text }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleLocationDelete(pendingAction)}
                        sx={{ 
                            color: THEME_COLORS.accent,
                            '&:hover': {
                                bgcolor: `${THEME_COLORS.accent}20`
                            }
                        }}
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={editConfirmOpen}
                onClose={() => setEditConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: THEME_COLORS.background,
                        color: THEME_COLORS.text,
                        border: `1px solid ${THEME_COLORS.accent}40`
                    }
                }}
            >
                <DialogTitle sx={{ color: THEME_COLORS.text }}>
                    Confirm Collection Name Change
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Are you sure you want to change the collection name to "{editingCollectionName}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setEditConfirmOpen(false)}
                        sx={{ color: THEME_COLORS.text }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleEditCollection(pendingAction)}
                        sx={{ 
                            color: THEME_COLORS.accent,
                            '&:hover': {
                                bgcolor: `${THEME_COLORS.accent}20`
                            }
                        }}
                        autoFocus
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={removeFromCollectionConfirmOpen}
                onClose={() => setRemoveFromCollectionConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: THEME_COLORS.background,
                        color: THEME_COLORS.text,
                        border: `1px solid ${THEME_COLORS.accent}40`
                    }
                }}
            >
                <DialogTitle sx={{ color: THEME_COLORS.text }}>
                    Remove Location from Collection
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Are you sure you want to remove this location from the collection?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setRemoveFromCollectionConfirmOpen(false)}
                        sx={{ color: THEME_COLORS.text }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            if (pendingAction) {
                                handleRemoveFromCollection(pendingAction.collectionId, pendingAction.locationId);
                            }
                        }}
                        sx={{ 
                            color: THEME_COLORS.accent,
                            '&:hover': {
                                bgcolor: `${THEME_COLORS.accent}20`
                            }
                        }}
                        autoFocus
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminMapPage;
