import React, { useState, useEffect, useRef } from 'react';
import './MapPage.css';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Paper,
  IconButton,
  Fade,
  Grow,
  Zoom,
  createTheme,
  ThemeProvider,
  alpha,
  Dialog,
  AppBar,
  Toolbar,
  Slide
} from '@mui/material';
import SidePanel from './SidePanel';
import { collection, onSnapshot, deleteDoc, doc, query, where, setDoc, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import WeatherComponent from './WeatherComponent';
import { motion } from 'framer-motion';
import {
  Explore,
  TravelExplore,
  LocationOn,
  Map as MapIcon,
  Navigation,
  LayersClear,
  Search,
  Close as CloseIcon
} from '@mui/icons-material';
import VideoMemory from './VideoMemory';
import PageLoader from './PageLoader';
import { toast } from 'react-hot-toast';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF3366',
      light: '#FF6B93',
      dark: '#E62E5C',
    },
    background: {
      default: '#1a1a1a',
      paper: 'rgba(255,255,255,0.05)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(255, 51, 102, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255,255,255,0.05)',
        },
      },
    },
  },
});

const createDetailedIcon = (number) => {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="grad${number}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#FF5252;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#D32F2F;stop-opacity:1" />
      </radialGradient>
    </defs>
    <path fill="url(#grad${number})" d="M32,52.789l-12-18C18.5,32,16,28.031,16,24c0-8.836,7.164-16,16-16s16,7.164,16,16c0,4.031-2.055,8-4,10.789L32,52.789z"/>
    <circle fill="white" cx="32" cy="24" r="10"/>
    <text x="32" y="28" font-size="14" font-weight="bold" fill="#D32F2F" text-anchor="middle" dominant-baseline="middle">${number}</text>
  </svg>`;
  return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 52 } });
};

const createUserLocationIcon = () => {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="gradUser" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#00BCD4;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#006064;stop-opacity:1" />
      </radialGradient>
    </defs>
    <circle fill="url(#gradUser)" cx="32" cy="32" r="12"/>
    <circle fill="white" cx="32" cy="32" r="8" opacity="0.4"/>
    <circle fill="#006064" cx="32" cy="32" r="4"/>
    <circle fill="none" stroke="#00BCD4" stroke-width="2" cx="32" cy="32" r="16">
      <animate attributeName="r" from="16" to="24" dur="1.5s" begin="0s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
    </circle>
  </svg>`;
  return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 32 } });
};

const createCollectionLocationIcon = (number) => {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="gradCollection${number}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
      </radialGradient>
    </defs>
    <path fill="url(#gradCollection${number})" d="M32,52.789l-12-18C18.5,32,16,28.031,16,24c0-8.836,7.164-16,16-16s16,7.164,16,16 c0,4.031-2.055,8-4,10.789L32,52.789z"/>
    <circle fill="white" cx="32" cy="24" r="10"/>
    <text x="32" y="28" font-size="14" font-weight="bold" fill="#1976D2" text-anchor="middle" dominant-baseline="middle">${number}</text>
  </svg>`;
  return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 52 } });
};

const createVisitedLocationIcon = () => {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="gradVisited" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#388E3C;stop-opacity:1" />
      </radialGradient>
    </defs>
    <path fill="url(#gradVisited)" d="M32,52.789l-12-18C18.5,32,16,28.031,16,24c0-8.836,7.164-16,16-16s16,7.164,16,16c0,4.031-2.055,8-4,10.789L32,52.789z"/>
    <circle fill="white" cx="32" cy="24" r="10"/>
    <path fill="#388E3C" d="M28,24l3,3l5-5" stroke="white" stroke-width="2"/>
  </svg>`;
  return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 52 } });
};

const HERE_API_KEY = 'zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Add debug logging utility
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] MapPage: ${message}`);
  if (data) {
    console.log('Data:', data);
  }
};

const MapPage = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null); 
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState([]);
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [locations, setLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionLocations, setSelectedCollectionLocations] = useState([]);
  const [userGeneratedLocations, setUserGeneratedLocations] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collectionMarkersMap, setCollectionMarkersMap] = useState(new Map());
  const [collectionLocations, setCollectionLocations] = useState([]);
  const [showMemoryButton, setShowMemoryButton] = useState(false);
  const [isVideoMemoryOpen, setIsVideoMemoryOpen] = useState(false);
  const [routePhotos, setRoutePhotos] = useState([]);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAdminCollections = async () => {
      try {
        const collectionsSnapshot = await getDocs(collection(db, 'adminCollections'));
        if (isSubscribed) {
          const collectionsData = collectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error("Error fetching admin collections:", error);
      }
    };

    fetchAdminCollections();

    return () => {
      isSubscribed = false;
    };
  }, []);
  

  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const notesRef = collection(db, 'notes');
        const qNotes = query(notesRef, where('userId', '==', user.uid));
        const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
          const notesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotes(notesData);
        });

        const photosRef = collection(db, 'photos');
        const qPhotos = query(photosRef, where('userId', '==', user.uid));
        const unsubscribePhotos = onSnapshot(qPhotos, (snapshot) => {
          const photosData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPhotos(photosData);
        });

        const locationsRef = collection(db, 'locations');
        const qLocations = query(locationsRef, where('userId', '==', user.uid));
        const unsubscribeLocations = onSnapshot(qLocations, (snapshot) => {
          const locationsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLocations(locationsData);
        });

        return () => {
          unsubscribeNotes();
          unsubscribePhotos();
          unsubscribeLocations();
        };
      } else {
        setNotes([]);
        setPhotos([]);
        setLocations([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error.message);
            setUserLocation({ lat: 55.8449, lng: -4.4300 }); // Default to UWS Paisley Campus
            setLoading(false);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        setUserLocation({ lat: 55.8449, lng: -4.4300 });
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  const clearMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove all objects except user marker
    map.getObjects().forEach((object) => {
      if (object !== userMarkerRef.current) {
        map.removeObject(object);
      }
    });

    // Reset markers array except for user marker
    markersRef.current = markersRef.current.filter(marker => marker === userMarkerRef.current);

    // Reset collection states
    setSelectedCollection("");
    setCollectionMarkersMap(new Map());
    setIsRouting(false); // Reset routing state when clearing markers

    // Re-add user-generated locations
    locations.forEach((location, index) => {
      if (!location.lat || !location.lng) return;

      const icon = location.visited ? 
        createVisitedLocationIcon() : 
        createDetailedIcon(index + 1);

      const marker = new window.H.map.Marker(
        { lat: location.lat, lng: location.lng },
        { icon }
      );

      marker.addEventListener('tap', () => {
        setSelectedLocation(location);
        setIsPanelOpen(true);
      });

      map.addObject(marker);
      markersRef.current.push(marker);
    });
  };
  

  

  const createAdminLocationIcon = (number) => {
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:#ffda47;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffa726;stop-opacity:1" />
        </radialGradient>
      </defs>
      <path fill="url(#grad2)" d="M32,52.789l-12-18C18.5,32,16,28.031,16,24c0-8.836,7.164-16,16-16s16,7.164,16,16 c0,4.031-2.055,8-4,10.789L32,52.789z"/>
      <circle fill="blue" cx="32" cy="24" r="10"/>
      <text x="32" y="28" font-size="14" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${number}</text>
    </svg>`;
    return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 52 } });
  };
  

  const fetchRoute = async () => {
    const fullURL = `/api/route?origin=55.858,4.294&destination=55.852,-4.305&routingMode=fast&transportMode=car&return=polyline`;
    
    try {
      const response = await fetch(fullURL);
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

useEffect(() => {
  if (userLocation && mapRef.current && !mapInstanceRef.current) {
    const platform = new window.H.service.Platform({
      apikey: HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();
    const map = new window.H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      zoom: 15,
      center: userLocation,
    });

    const behavior = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
    window.H.ui.UI.createDefault(map, defaultLayers);

    mapInstanceRef.current = map;

    // Create and add the center-to-user button
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="white" stroke="#333" stroke-width="2"/>
        <circle cx="12" cy="12" r="7" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="12" cy="12" r="1" fill="#333"/>
      </svg>
    `;
    
    Object.assign(button.style, {
      position: 'absolute',
      left: '20px',
      bottom: '17px',
      width: '40px',
      height: '40px',
      padding: '8px',
      background: 'white',
      border: 'none',
      borderRadius: '50%',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      cursor: 'pointer',
      zIndex: '1000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.2s ease'
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', () => {
      if (userLocation && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(userLocation);
        mapInstanceRef.current.setZoom(15);
      }
    });

    mapRef.current.appendChild(button);

    const userMarker = new window.H.map.Marker(userLocation);
    userMarkerRef.current = userMarker;
    map.addObject(userMarker);
  }
  updateMarkers();
}, [userLocation]);


  
  const createCustomIcon = (number, color) => {
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:${color === 'blue' ? '#67b7dc' : '#ff6347'};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color === 'blue' ? '#007bff' : '#F76D57'};stop-opacity:1" />
        </radialGradient>
      </defs>
      <path fill="url(#grad1)" d="M32,52.789l-12-18C18.5,32,16,28.031,16,24c0-8.836,7.164-16,16-16s16,7.164,16,16c0,4.031-2.055,8-4,10.789L32,52.789z"/>
      <circle fill="#394240" cx="32" cy="24" r="10"/>
      <text x="32" y="28" font-size="14" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${number}</text>
    </svg>`;
    return new window.H.map.Icon(svgMarkup, { anchor: { x: 32, y: 52 } });
  };
 
  
  const addMarkerToMap = (location, isCollectionLocation = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;
  
    const marker = new window.H.map.Marker({ 
      lat: location.lat, 
      lng: location.lng 
    });
    map.addObject(marker);
  
    marker.addEventListener('tap', () => {
      setSelectedLocation({
        ...location,
        locationId: location.id,
        isCollectionLocation
      });
      setIsPanelOpen(true);
    });
  
    return marker;
  };
  
  
  // Define functions for red and blue icons
  const createDetailedIcon = (number) => createCustomIcon(number, 'red');
  const createPlannedLocationIcon = (number) => createCustomIcon(number, 'blue');
  

  const updateMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
  
    // Clear existing markers except user location
    map.getObjects().forEach((object) => {
      if (object !== userMarkerRef.current) {
        map.removeObject(object);
      }
    });
    markersRef.current = markersRef.current.filter(marker => marker === userMarkerRef.current);

    // Add user location marker
    if (userLocation) {
      if (userMarkerRef.current) {
        map.removeObject(userMarkerRef.current);
      }
      userMarkerRef.current = new window.H.map.Marker(
        userLocation,
        { icon: createUserLocationIcon() }
      );
      map.addObject(userMarkerRef.current);
    }

    // If a collection is selected, show collection locations
    if (selectedCollection && collectionLocations.length > 0) {
      collectionLocations.forEach((location, index) => {
        if (!location.lat || !location.lng) return;

        const marker = new window.H.map.Marker(
          { lat: location.lat, lng: location.lng },
          { 
            icon: location.visited ? 
              createVisitedLocationIcon() : 
              createCollectionLocationIcon(index + 1)
          }
        );

        marker.addEventListener('tap', () => {
          setSelectedLocation({
            ...location,
            isCollectionLocation: true,
            collectionId: selectedCollection
          });
          setIsPanelOpen(true);
        });

        map.addObject(marker);
        markersRef.current.push(marker);
      });
    } else {
      // Show user-generated locations if no collection is selected
      let unvisitedCount = 1;
      locations.forEach((location) => {
        if (!location.lat || !location.lng) return;

        const marker = new window.H.map.Marker(
          { lat: location.lat, lng: location.lng },
          { 
            icon: location.visited ? 
              createVisitedLocationIcon() : 
              createDetailedIcon(unvisitedCount++)
          }
        );

        marker.addEventListener('tap', () => {
          setSelectedLocation(location);
          setIsPanelOpen(true);
        });

        map.addObject(marker);
        markersRef.current.push(marker);
      });
    }
  };
  

  useEffect(() => {
    updateMarkers();
  }, [locations, waypoints]);





  const handleAddLocation = async (location) => {
    // Ensure the user is authenticated
    if (!user || !user.uid) {
      console.error("User is not authenticated");
      return;
    }
  
    // Verify that location data is structured as expected
    if (!location || !location.title || !location.position || !location.position.lat || !location.position.lng) {
      console.error("Location data is incomplete", location);
      return;
    }
  
    const orderNumber = locations.length + 1; // Calculate the next order number
  
    // Define the Firestore document data
    const locationData = {
      title: location.title,
      lat: location.position.lat,
      lng: location.position.lng,
      userId: user.uid,
      order: orderNumber,
    };
  
    try {
      // Create a new document reference in the 'locations' collection
      const locationRef = doc(collection(db, 'locations'));
      await setDoc(locationRef, locationData); // Save the location data to Firestore
  
      // Update the local state with the new location, including its generated ID
      setLocations((prevLocations) => [...prevLocations, { ...locationData, id: locationRef.id }]);
      console.log("Location added successfully:", locationData);
    } catch (error) {
      console.error("Error adding location:", error.message, error.code);
    }
  };
  
  
  const calculateRoute = async () => {
    if (!userLocation) {
      console.error("User location not available");
      return;
    }

    console.log('Starting route calculation...');

    // Get the appropriate locations based on whether we're viewing a collection
    const allLocations = selectedCollection ? collectionLocations : locations;
    
    // Filter for unvisited locations
    const unvisitedLocations = allLocations.filter(loc => !loc.visited);

    if (unvisitedLocations.length === 0) {
      console.error("No unvisited locations available for routing");
      return;
    }

    try {
      const map = mapInstanceRef.current;
      
      // Clear existing routes
      map.getObjects().forEach((obj) => {
        if (obj instanceof window.H.map.Polyline) {
          map.removeObject(obj);
        }
      });

      const platform = new window.H.service.Platform({
        apikey: HERE_API_KEY
      });

      const router = platform.getRoutingService(null, 8);

      // Function to calculate route between two points with retry logic
      const calculateRouteSegment = async (start, end, retryCount = 0) => {
        return new Promise((resolve, reject) => {
          // Add delay between requests to avoid rate limiting
          setTimeout(() => {
            const params = {
              'routingMode': 'fast',
              'transportMode': 'car',
              'origin': `${start.lat},${start.lng}`,
              'destination': `${end.lat},${end.lng}`,
              'return': 'polyline'
            };

            router.calculateRoute(params, 
              (result) => {
                if (result.routes && result.routes.length > 0) {
                  resolve(result.routes[0]);
                } else {
                  reject(new Error('No route found'));
                }
              },
              async (error) => {
                if (error.toString().includes('Rate limit') && retryCount < 3) {
                  console.log(`Rate limit hit, retrying after delay... (attempt ${retryCount + 1})`);
                  try {
                    // Wait longer between retries
                    await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
                    const result = await calculateRouteSegment(start, end, retryCount + 1);
                    resolve(result);
                  } catch (retryError) {
                    reject(retryError);
                  }
                } else {
                  reject(error);
                }
              }
            );
          }, 1000); // Base delay between requests
        });
      };

      // Calculate routes between consecutive waypoints
      const waypoints = [
        { lat: userLocation.lat, lng: userLocation.lng },
        ...unvisitedLocations
      ];

      const routeSegments = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        console.log(`Calculating route segment ${i + 1} of ${waypoints.length - 1}`);
        try {
          const segment = await calculateRouteSegment(waypoints[i], waypoints[i + 1]);
          routeSegments.push(segment);
        } catch (error) {
          console.error(`Error calculating segment ${i + 1}:`, error);
          // Continue with next segment even if one fails
          continue;
        }
      }

      // Draw successful route segments
      routeSegments.forEach((segment, index) => {
        const lineString = new window.H.geo.LineString();
        
        segment.sections.forEach(section => {
          if (section.polyline) {
            const points = window.H.geo.LineString.fromFlexiblePolyline(section.polyline).getLatLngAltArray();
            for (let i = 0; i < points.length; i += 3) {
              lineString.pushLatLngAlt(points[i], points[i + 1], points[i + 2] || 0);
            }
          }
        });

        const routeLine = new window.H.map.Polyline(lineString, {
          style: { 
            strokeColor: '#4A90E2', 
            lineWidth: 4,
            lineDash: []
          }
        });

        map.addObject(routeLine);
      });

      // Update markers
      let unvisitedCount = 1;

      // Add user location marker
      const userMarker = new window.H.map.Marker(
        userLocation,
        { icon: createUserLocationIcon() }
      );
      map.addObject(userMarker);

      // Add markers for all locations
      allLocations.forEach((location) => {
        const isVisited = location.visited;
        const marker = new window.H.map.Marker(
          { lat: location.lat, lng: location.lng },
          { 
            icon: isVisited ? 
              createVisitedLocationIcon() : 
              selectedCollection ? 
                createCollectionLocationIcon(unvisitedCount++) : 
                createDetailedIcon(unvisitedCount++)
          }
        );

        marker.addEventListener('tap', () => {
          setSelectedLocation(location);
          setIsPanelOpen(true);
        });

        map.addObject(marker);
      });

      // Calculate bounds that include all waypoints
      const bounds = new window.H.geo.Rect(
        Math.min(...waypoints.map(wp => wp.lat)),
        Math.min(...waypoints.map(wp => wp.lng)),
        Math.max(...waypoints.map(wp => wp.lat)),
        Math.max(...waypoints.map(wp => wp.lng))
      );

      // Adjust viewport to show all routes and markers
      map.getViewModel().setLookAtData({
        bounds: bounds,
        padding: { top: 50, right: 50, bottom: 50, left: 50 }
      });

      console.log('All route segments successfully calculated and displayed');

    } catch (error) {
      console.error('Error in route calculation:', error);
    }
  };
  

  

  

  const handleSubmitNote = async (newNote) => {
    if (!selectedLocation?.id) {
      console.error('Location ID is undefined');
      return;
    }
    try {
      const noteRef = doc(collection(db, 'notes'));
      await setDoc(noteRef, { ...newNote, locationId: selectedLocation.id, userId: user.uid });
      setNotes((prevNotes) => [...prevNotes, { id: noteRef.id, ...newNote }]);
    } catch (error) {
      console.error("Error adding/updating note:", error);
    }
  };
  
  const handleSubmitPhoto = async (newPhoto) => {
    if (!selectedLocation?.id) {
      console.error('Location ID is undefined');
      return;
    }
    try {
      const photoRef = doc(collection(db, 'photos'));
      await setDoc(photoRef, { ...newPhoto, locationId: selectedLocation.id, userId: user.uid });
      setPhotos((prevPhotos) => [...prevPhotos, { id: photoRef.id, ...newPhoto }]);
    } catch (error) {
      console.error("Error adding photo:", error);
    }
  };
  
  
    const handleSearchChange = async (e) => {
    setSearchTerm(e.target.value);

    if (e.target.value) {
      const platform = new window.H.service.Platform({
        apikey: "zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ",
      });

      try {
        const service = platform.getSearchService();
        service.geocode(
          {
            q: e.target.value,
          },
          (result) => {
            const places = result.items?.map((item) => ({
              id: item.id,
              title: item.title,
              position: item.position,
            })) || [];
            setSearchResults(places);
          },
          (error) => {
            console.error('Error fetching location suggestions:', error);
            setSearchResults([]);
          }
        );
      } catch (error) {
        console.error('Error initializing search service:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = async (location) => {
    const orderNumber = locations.length + 1; // Calculate the next order number

    if (!user) {
      console.error('User is not authenticated');
      return;
    }
  
    try {
      const locationRef = doc(collection(db, 'locations'));
      await setDoc(locationRef, {
        title: location.title,
        lat: location.position.lat,
        lng: location.position.lng,
        userId: user.uid,
        order: orderNumber, // Save the order number

      });
  
      setSearchResults([]);
      setSearchTerm('');
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };
  
  const handleDeleteLocation = async (locationId) => {
    console.log('MapPage: handleDeleteLocation called with ID:', locationId);
    
    try {
      console.log('Clearing existing markers');
      clearMarkers();
      
      console.log('Updating locations state');
      setLocations(prevLocations => {
        const newLocations = prevLocations.filter(loc => loc.id !== locationId);
        console.log('New locations count:', newLocations.length);
        return newLocations;
      });

      console.log('Re-adding markers to map');
      const map = mapInstanceRef.current;
      if (!map) {
        console.error('Map instance not found');
        return;
      }

      locations
        .filter(loc => loc.id !== locationId)
        .forEach((location, index) => {
          console.log('Adding marker for location:', location.id);
          const marker = new window.H.map.Marker(
            { lat: location.lat, lng: location.lng },
            { icon: location.visited ? createVisitedLocationIcon() : createDetailedIcon(index + 1) }
          );
          marker.addEventListener('tap', () => {
            setSelectedLocation(location);
            setIsPanelOpen(true);
          });
          map.addObject(marker);
          markersRef.current.push(marker);
        });

      console.log('Location deletion completed');

    } catch (error) {
      console.error('Error in MapPage handleDeleteLocation:', error);
      toast.error('Failed to update map after deletion');
    }
  };
  
    const handleAddNote = async (newNote) => {
    if (!selectedLocation?.locationId) {
      console.error('Location ID is undefined');
      return;
    }
  
    try {
      const noteRef = doc(collection(db, 'notes'));
      await setDoc(noteRef, { ...newNote, locationId: selectedLocation.locationId, userId: user.uid });
      setNotes((prevNotes) => [...prevNotes, { id: noteRef.id, ...newNote }]);
    } catch (error) {
      console.error("Error adding/updating note:", error);
    }
  };
  
    const handleDeleteNote = async (noteId) => {
    if (!noteId) {
      console.error("Note ID is undefined");
      return;
    }
  
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };
  
  const handleAddPhoto = async (newPhoto) => {
    if (!selectedLocation?.locationId) {
      console.error('Location ID is undefined');
      return;
    }
  
    try {
      const photoRef = doc(collection(db, 'photos'));
      await setDoc(photoRef, { ...newPhoto, locationId: selectedLocation.locationId, userId: user.uid });
      setPhotos((prevPhotos) => [...prevPhotos, { id: photoRef.id, ...newPhoto }]);
    } catch (error) {
      console.error("Error adding photo:", error);
    }
  };
  
    const handleDeletePhoto = async (photoId) => {
    if (!photoId) {
      console.error("Photo ID is undefined");
      return;
    }
  
    try {
      await deleteDoc(doc(db, 'photos', photoId));
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };
  
  const handleMarkAsVisited = async (visitedStatus) => {
    if (!selectedLocation) return;

    try {
      if (selectedLocation.isCollectionLocation) {
        // Update visited status in adminLocations collection
        const locationRef = doc(db, 'adminLocations', selectedLocation.id);
        await updateDoc(locationRef, { visited: visitedStatus });

        // Update local state
        setCollectionLocations(prevLocations =>
          prevLocations.map(loc =>
            loc.id === selectedLocation.id
              ? { ...loc, visited: visitedStatus }
              : loc
          )
        );

        // Update markers on the map
        const map = mapInstanceRef.current;
        clearMarkers();
        
        collectionLocations.forEach((location, index) => {
          const marker = new window.H.map.Marker(
            { lat: location.lat, lng: location.lng },
            { 
              icon: location.id === selectedLocation.id 
                ? createVisitedLocationIcon()
                : location.visited
                  ? createVisitedLocationIcon()
                  : createCollectionLocationIcon(index + 1)
            }
          );

          marker.addEventListener('tap', () => {
            setSelectedLocation({
              ...location,
              isCollectionLocation: true,
              collectionId: selectedCollection
            });
            setIsPanelOpen(true);
          });

          map.addObject(marker);
          markersRef.current.push(marker);
        });

      } else {
        // Handle user-generated locations (existing code)
        const locationRef = doc(db, 'locations', selectedLocation.id);
        await updateDoc(locationRef, { visited: visitedStatus });
        
        setLocations(prevLocations =>
          prevLocations.map(loc =>
            loc.id === selectedLocation.id
              ? { ...loc, visited: visitedStatus }
              : loc
          )
        );
      }

    } catch (error) {
      console.error("Error updating visited status:", error);
    }
  };

const handleLocationSelect = async (selectedLocations) => {
  if (!userLocation || !selectedLocations || !selectedLocations.length) {
    console.error('User location or selected locations are missing');
    return;
  }

  const map = mapInstanceRef.current;
  if (!map) return;

  // Clear existing markers except user marker
  map.getObjects().forEach((object) => {
    if (object !== userMarkerRef.current) {
      map.removeObject(object);
    }
  });

  // Add markers for each location
  selectedLocations.forEach((location) => {
    const marker = new window.H.map.Marker({ 
      lat: location.lat, 
      lng: location.lng 
    });
    map.addObject(marker);

    marker.addEventListener('tap', () => {
      const selectedLocation = location.id
        ? { ...location } 
        : { ...location };
      setSelectedLocation(selectedLocation);
      setIsPanelOpen(true);
    });
  });

  // Calculate and draw route if there are multiple locations
  if (selectedLocations.length > 1) {
    calculateRoute();
  }
};

const drawRouteOnMap = (route) => {
  const map = mapInstanceRef.current;
  if (!map) return;

  try {
    // Clear existing routes
    map.getObjects().forEach((obj) => {
      if (obj instanceof window.H.map.Polyline) {
        map.removeObject(obj);
      }
    });

    if (!route.sections || !route.sections.length) {
      console.error('Invalid route data');
      return;
    }

    // Create a LineString to hold all coordinates
    const lineString = new window.H.geo.LineString();

    route.sections.forEach(section => {
      if (!section.polyline) return;

      try {
        const points = window.H.geo.LineString.fromFlexiblePolyline(section.polyline).getLatLngAltArray();
        
        for (let i = 0; i < points.length; i += 3) {
          lineString.pushLatLngAlt(points[i], points[i + 1], points[i + 2] || 0);
        }
      } catch (error) {
        console.error('Error parsing section polyline:', error);
      }
    });

    // Create and add the route polyline
    if (lineString.getPointCount() > 0) {
      const routeLine = new window.H.map.Polyline(lineString, {
        style: {
          lineWidth: 5,
          strokeColor: '#00A3FF',
          lineCap: 'round'
        }
      });

      map.addObject(routeLine);

      // Adjust the viewport to show the entire route
      map.getViewModel().setLookAtData({
        bounds: routeLine.getBoundingBox(),
        padding: { top: 50, right: 50, bottom: 50, left: 50 }
      });
    }
  } catch (error) {
    console.error('Error drawing route:', error);
  }
};

// Helper function to create waypoint icons
const createWaypointIcon = (number) => {
  const svgMarkup = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#00A3FF" stroke="white" stroke-width="2"/>
      <text x="16" y="16" font-size="12" fill="white" text-anchor="middle" dy=".3em">${number}</text>
    </svg>`;
  return new window.H.map.Icon(svgMarkup);
};

  


const handleNavigation = async () => {
  console.log("Starting navigation calculation...");
  setIsRouting(true); // Set routing to true when navigation starts
  await calculateRoute();
  
  console.log("Navigation completed, setting showMemoryButton to true");
  setShowMemoryButton(true);
  
  // Get photos based on whether we're navigating a collection or user locations
  const routeLocationPhotos = photos.filter(photo => {
    if (selectedCollection) {
      // For collection navigation, check if photo's locationId matches any collection location's id
      console.log("Checking photo:", photo);
      const matchingLocation = collectionLocations.find(location => 
        location.id === photo.locationId
      );
      
      if (matchingLocation) {
        console.log("Found matching collection location for photo:", matchingLocation);
      }
      
      return matchingLocation !== undefined;
    } else {
      // For user locations, check if photo's locationId matches any user location's id
      console.log("Checking photo:", photo);
      const matchingLocation = locations.find(location => 
        location.id === photo.locationId
      );
      
      if (matchingLocation) {
        console.log("Found matching user location for photo:", matchingLocation);
      }
      
      return matchingLocation !== undefined;
    }
  });
  
  // Log all the relevant data for debugging
  console.log("All photos:", photos);
  console.log("Selected location:", selectedLocation);
  console.log("Selected collection:", selectedCollection);
  console.log("Collection locations:", collectionLocations);
  console.log("User locations:", locations);
  console.log("Filtered route photos:", routeLocationPhotos);
  
  // If we still have no photos, log more details about the matching process
  if (routeLocationPhotos.length === 0) {
    console.log("No photos matched. Detailed matching info:");
    photos.forEach(photo => {
      console.log("Photo:", {
        id: photo.id,
        locationId: photo.locationId
      });
      
      if (selectedCollection) {
        collectionLocations.forEach(location => {
          console.log("Comparing with collection location:", {
            id: location.id,
            matches: location.id === photo.locationId
          });
        });
      } else {
        locations.forEach(location => {
          console.log("Comparing with user location:", {
            id: location.id,
            matches: location.id === photo.locationId
          });
        });
      }
    });
  }
  
  setRoutePhotos(routeLocationPhotos);
};
const calculateSegmentedRoute = async (waypoints) => {
  const platform = new window.H.service.Platform({
    apikey: 'zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ',
  });
  const routingService = platform.getRoutingService(null, 8);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const routingParameters = {
      routingMode: 'fast',
      transportMode: 'car',
      origin: `${waypoints[i].lat},${waypoints[i].lng}`,
      destination: `${waypoints[i + 1].lat},${waypoints[i + 1].lng}`,
      return: 'polyline,turnByTurnActions',
    };

    try {
      await routingService.calculateRoute(routingParameters, (result) => {
        if (result.routes.length) {
          const route = result.routes[0];
          drawRouteOnMap(route);  // Draw this segment of the route
        }
      }, (error) => {
        console.error('Error calculating segment:', error);
      });
    } catch (error) {
      console.error('Error during route calculation:', error);
    }
  }
};

const decodePolyline = (encoded) => {
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  const coordinates = [];

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    const newLat = lat * 1e-5;
    const newLng = lng * 1e-5;

    if (Math.abs(newLat) <= 90 && Math.abs(newLng) <= 180) {
      coordinates.push({ lat: newLat, lng: newLng });
    } else {
      console.error(`Invalid coordinate detected: lat=${newLat}, lng=${newLng}`);
      break; // Stop processing if invalid coordinates are found
    }
  }

  return coordinates;
};

const centerMapOnUserLocation = () => {
  if (mapInstanceRef.current && userLocation) {
    mapInstanceRef.current.setCenter(userLocation);
    mapInstanceRef.current.setZoom(15); // Adjust zoom level as needed
  }
};

  const handleAddWaypoint = () => {
    if (selectedLocation) {
      setWaypoints((prevWaypoints) => [...prevWaypoints, selectedLocation]);
    }
  };

  // Update the useEffect that handles collection monitoring
  useEffect(() => {
    if (!selectedCollection) return;

    console.log('Setting up collection listener for:', selectedCollection); // Debug log

    const unsubscribe = onSnapshot(
      doc(db, 'adminCollections', selectedCollection),
      async (collectionDoc) => {
        console.log('Collection update received:', collectionDoc.data()); // Debug log

        if (!collectionDoc.exists()) {
          clearMarkers();
          return;
        }

        const collectionData = collectionDoc.data();
        let collectionLocations = [];

        // Handle both possible data structures
        if (Array.isArray(collectionData.locations)) {
          collectionLocations = collectionData.locations;
        } else if (Array.isArray(collectionData.locationIds)) {
          const locationPromises = collectionData.locationIds.map(id => 
            getDoc(doc(db, 'adminLocations', id))
          );
          const locationDocs = await Promise.all(locationPromises);
          collectionLocations = locationDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() }));
        }

        console.log('Updated Collection Locations:', collectionLocations); // Debug log
        
        // Create a new Map for the markers
        const newMarkersMap = new Map();

        // Add each location to the map, preserving original IDs
        collectionLocations.forEach((location, index) => {
          if (location.lat && location.lng) {
            newMarkersMap.set(location.id, {
              ...location,
              displayIndex: index + 1 // Add display index for marker numbering
            });
          }
        });

        setCollectionMarkersMap(newMarkersMap);
        setCollectionLocations(collectionLocations); // Update collection locations state
        updateMarkers();
      }
    );

    return () => unsubscribe();
  }, [selectedCollection]);

  // Update handleCollectionSelect to be simpler since the useEffect handles the real-time updates
  const handleCollectionSelect = async (collectionId) => {
    console.log('Selecting collection:', collectionId);

    if (collectionId === "clear-admin" || !collectionId) {
      setSelectedCollection("");
      setCollectionLocations([]);
      clearMarkers();
      // Immediately show user locations after clearing
      const map = mapInstanceRef.current;
      locations.forEach((location, index) => {
        const marker = new window.H.map.Marker(
          { lat: location.lat, lng: location.lng },
          { icon: location.visited ? createVisitedLocationIcon() : createDetailedIcon(index + 1) }
        );
        marker.addEventListener('tap', () => {
          setSelectedLocation(location);
          setIsPanelOpen(true);
        });
        map.addObject(marker);
        markersRef.current.push(marker);
      });
      return;
    }

    try {
      // Clear existing markers
      clearMarkers();

      // Get the collection document
      const collectionDoc = await getDoc(doc(db, 'adminCollections', collectionId));
      if (!collectionDoc.exists()) return;

      const { locationIds } = collectionDoc.data();
      console.log('Location IDs:', locationIds);

      // Fetch all location documents
      const locationPromises = locationIds.map(id => 
        getDoc(doc(db, 'adminLocations', id))
      );
      
      const locationDocs = await Promise.all(locationPromises);
      const locations = locationDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      console.log('Fetched collection locations:', locations);
      
      setCollectionLocations(locations);
      setSelectedCollection(collectionId);

      // Add markers for collection locations
      const map = mapInstanceRef.current;
      locations.forEach((location, index) => {
        const marker = new window.H.map.Marker(
          { lat: location.lat, lng: location.lng },
          { icon: location.visited ? createVisitedLocationIcon() : createCollectionLocationIcon(index + 1) }
        );

        marker.addEventListener('tap', () => {
          setSelectedLocation({
            ...location,
            isCollectionLocation: true,
            collectionId: collectionId
          });
          setIsPanelOpen(true);
        });

        map.addObject(marker);
        markersRef.current.push(marker);
      });

    } catch (error) {
      console.error('Error selecting collection:', error);
    }
  };

  // Add a useEffect to handle collection location updates
  useEffect(() => {
    if (selectedCollection && collectionLocations.length > 0) {
      console.log('Collection locations updated:', collectionLocations);
      updateMarkers();
    }
  }, [selectedCollection, collectionLocations]);

  const handleLocationUpdate = async (locationId, updatedLocation) => {
    try {
      if (updatedLocation.isCollectionLocation) {
        // Update collection locations state
        setCollectionLocations(prevLocations =>
          prevLocations.map(loc =>
            loc.id === locationId ? { ...loc, ...updatedLocation } : loc
          )
        );
      } else {
        // Update user locations state
        setLocations(prevLocations =>
          prevLocations.map(loc =>
            loc.id === locationId ? { ...loc, ...updatedLocation } : loc
          )
        );
      }

      // Update markers on the map
      updateMarkers();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Add this new function to fetch photos for a route
  const fetchRoutePhotos = async (routeLocations) => {
    try {
      debugLog('Starting route photos fetch', { locations: routeLocations });
      const photosData = [];
      
      // Log all photos first
      const allPhotosRef = collection(db, 'photos');
      const allPhotosQuery = query(
        allPhotosRef,
        where('userId', '==', user.uid)
      );
      const allPhotosSnapshot = await getDocs(allPhotosQuery);
      debugLog('All photos in database:', allPhotosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      // Get waypoints from the route
      const routeWaypoints = waypoints.filter(wp => wp.isVisited);
      debugLog('Filtered visited waypoints', routeWaypoints);

      // Fetch photos for each visited waypoint
      for (const waypoint of routeWaypoints) {
        debugLog('Fetching photos for waypoint', {
          lat: waypoint.lat,
          lng: waypoint.lng,
          address: waypoint.address,
          isVisited: waypoint.isVisited
        });
        
        // Query photos collection for photos at this waypoint
        const photosRef = collection(db, 'photos');
        const q = query(
          photosRef,
          where('userId', '==', user.uid),
          where('latitude', '==', waypoint.lat),
          where('longitude', '==', waypoint.lng)
        );
        
        debugLog('Executing Firestore query for waypoint', {
          userId: user.uid,
          latitude: waypoint.lat,
          longitude: waypoint.lng
        });

        const snapshot = await getDocs(q);
        debugLog(`Found ${snapshot.docs.length} photos for waypoint`);
        
        const waypointPhotos = snapshot.docs.map(doc => {
          const data = doc.data();
          debugLog('Processing photo document', {
            id: doc.id,
            latitude: data.latitude,
            longitude: data.longitude,
            url: data.url,
            storagePath: data.storagePath
          });
          
          return {
            id: doc.id,
            url: data.url,
            storagePath: data.storagePath,
            timestamp: data.timestamp,
            latitude: data.latitude,
            longitude: data.longitude,
            location: waypoint.address || `${waypoint.lat}, ${waypoint.lng}`,
            ...data
          };
        });
        
        photosData.push(...waypointPhotos);
      }

      // Sort all photos by timestamp
      const sortedPhotos = photosData.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return a.timestamp - b.timestamp;
        }
        return 0;
      });
      
      debugLog('Final route photos:', {
        totalCount: sortedPhotos.length,
        photos: sortedPhotos.map(p => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          url: p.url,
          storagePath: p.storagePath,
          location: p.location
        }))
      });

      setRoutePhotos(sortedPhotos);
      setShowMemoryButton(sortedPhotos.length > 0);
    } catch (error) {
      debugLog('Error fetching route photos:', error);
      console.error('Error fetching route photos:', error);
    }
  };

  // Update the route calculation function
  const calculateAndDisplayRoute = async (locations) => {
    if (!locations || locations.length < 2) {
      debugLog('Insufficient locations for route calculation');
      return;
    }
    
    setNavigationLoading(true);
    try {
      debugLog('Starting route calculation', { locations });
      
      // Clear existing route photos before calculating new route
      setRoutePhotos([]);
      setShowMemoryButton(false);
      
      // ... existing route calculation code ...

      // After route is calculated and waypoints are set
      debugLog('Route calculated, fetching photos');
      await fetchRoutePhotos(locations);
      
    } catch (error) {
      debugLog('Error in route calculation:', error);
      console.error('Error calculating route:', error);
    } finally {
      setNavigationLoading(false);
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // ... existing map initialization code ...
      } catch (error) {
        console.error('Error initializing map:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

  if (loading) {
    return <PageLoader message="Loading map..." />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box 
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{ 
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          color: 'white',
          backgroundImage: 'linear-gradient(to bottom, #1a1a1a, #242424)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {loading ? (
            <Box
              sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity },
                }}
              >
                <CircularProgress 
                  size={70} 
                  thickness={4} 
                  sx={{ color: theme.palette.primary.main }}
                />
              </motion.div>
              <Typography variant="h6" color="text.secondary">
                Loading your location...
              </Typography>
            </Box>
          ) : (
            <Fade in timeout={1000}>
              <Box>
                {/* Map Container */}
                <Paper
                  ref={mapRef}
                  elevation={0}
                  sx={{
                    height: 500,
                    mb: 4,
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.005)',
                    },
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Search Bar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80%',
                      maxWidth: 500,
                      zIndex: 10,
                    }}
                  >
                    <TextField
                      fullWidth
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search for a location..."
                      InputProps={{
                        startAdornment: (
                          <Search sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                    
                    {/* Search Results */}
                    <Grow in={searchResults.length > 0}>
                      <Paper
                        sx={{
                          mt: 1,
                          maxHeight: 300,
                          overflowY: 'auto',
                          bgcolor: 'rgba(0,0,0,0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <List>
                          {searchResults.map((result) => (
                            <ListItem
                              key={result.id}
                              button
                              onClick={() => handleSelectLocation(result)}
                              sx={{
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  transform: 'translateX(8px)',
                                },
                              }}
                            >
                              <ListItemIcon>
                                <LocationOn sx={{ color: theme.palette.primary.main }} />
                              </ListItemIcon>
                              <ListItemText primary={result.title} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grow>
                  </Box>

                  {/* Recenter Button */}
                  <Zoom in timeout={500}>
                    <Button
                      variant="contained"
                      onClick={centerMapOnUserLocation}
                      sx={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        minWidth: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.9),
                        '&:hover': {
                          bgcolor: theme.palette.primary.main,
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <Navigation />
                    </Button>
                  </Zoom>
                </Paper>

                {/* Action Buttons */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Explore />}
                      onClick={handleNavigation}
                      sx={{
                        py: 2,
                        bgcolor: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {isRouting ? 'Start Navigation' : 'Start Navigation'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Select
                        value={selectedCollection}
                        onChange={(e) => handleCollectionSelect(e.target.value)}
                        displayEmpty
                        sx={{
                          height: '100%',
                          bgcolor: 'rgba(0,0,0,0.7)',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '& .MuiSelect-select': {
                            py: 1.5,
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: 'rgba(0,0,0,0.9)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              '& .MuiMenuItem-root': {
                                py: 1.5,
                                '&:hover': {
                                  bgcolor: 'rgba(255,51,102,0.1)',
                                },
                                '&.Mui-selected': {
                                  bgcolor: 'rgba(255,51,102,0.2)',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,51,102,0.3)',
                                  },
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Select a Collection
                        </MenuItem>
                        {collections.map((collection) => (
                          <MenuItem 
                            key={collection.id} 
                            value={collection.id}
                            sx={{
                              color: 'rgba(255,255,255,0.9)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: theme.palette.primary.main,
                              },
                            }}
                          >
                            {collection.name}
                          </MenuItem>
                        ))}
                        <MenuItem 
                          value="clear-admin"
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <LayersClear sx={{ color: theme.palette.primary.main }} />
                          Clear Collection
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {isRouting && routePhotos.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setIsVideoMemoryOpen(true)}
                        sx={{
                          py: 2,
                          bgcolor: theme.palette.secondary.main,
                          '&:hover': {
                            bgcolor: theme.palette.secondary.dark,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Create Memory Video
                      </Button>
                    </Grid>
                  )}
                </Grid>

                {/* Weather Component */}
                <Fade in timeout={1000}>
                  <Box>
                    <WeatherComponent userLocation={userLocation} />
                  </Box>
                </Fade>

                {/* Side Panel */}
                {isPanelOpen && selectedLocation && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <SidePanel
                      user={user}
                      location={selectedLocation}
                      allNotes={notes}
                      allPhotos={photos}
                      onAddNote={handleAddNote}
                      onDeleteNote={handleDeleteNote}
                      onAddPhoto={handleAddPhoto}
                      onDeletePhoto={handleDeletePhoto}
                      onMarkAsVisited={handleMarkAsVisited}
                      onDeleteLocation={handleDeleteLocation}
                      onClose={() => setIsPanelOpen(false)}
                      isCollectionLocation={selectedLocation.isCollectionLocation}
                      onLocationUpdate={handleLocationUpdate}
                    />
                  </motion.div>
                )}
              </Box>
            </Fade>
          )}
        </Container>
      </Box>
      
      <VideoMemory 
        open={isVideoMemoryOpen}
        onClose={() => setIsVideoMemoryOpen(false)}
        locationPhotos={routePhotos}
      />
      
      
    </ThemeProvider>
  );
  
};
export default MapPage;

