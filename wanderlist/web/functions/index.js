const express = require("express");
const axios = require("axios");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cors = require("cors");
const { generateVideo } = require('./src/generateVideo');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
}));

// Video generation endpoint
app.post("/generate-video", async (req, res) => {
  console.log("Received video generation request");
  
  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        error: "Request body is missing"
      });
    }

    if (!req.body.photos || !Array.isArray(req.body.photos)) {
      return res.status(400).json({
        error: "Photos array is required"
      });
    }

    if (req.body.photos.length === 0) {
      return res.status(400).json({
        error: "At least one photo is required"
      });
    }

    // Log request details
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Generate video
    const result = await generateVideo(req.body.photos, {
      width: parseInt(req.body.width) || 1920,
      height: parseInt(req.body.height) || 1080,
      fps: parseInt(req.body.fps) || 30,
      quality: parseInt(req.body.quality) || 23,
      duration: parseInt(req.body.duration) || 5,
      transition: req.body.transition || 'fade',
      backgroundColor: req.body.backgroundColor || 'black',
      musicTrack: req.body.musicTrack,
      musicVolume: parseFloat(req.body.musicVolume) || 0.5,
      preset: req.body.preset || 'medium'
    });

    // Send response
    res.json({
      success: true,
      videoUrl: result.videoUrl
    });

  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
});

// HERE API route endpoint
app.get("/route", async (req, res) => {
  const { origin, destination, routingMode, transportMode, return: returnType, via } = req.query;
  const HERE_API_KEY = "zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ";

  try {
    let viaWaypoints = "";
    if (via) {
      viaWaypoints = Array.isArray(via) 
        ? via.map(point => `&via=${point}`).join("") 
        : `&via=${via}`;
    }

    const fullURL = `https://router.hereapi.com/v8/routes?apikey=${HERE_API_KEY}&origin=${origin}&destination=${destination}${viaWaypoints}&routingMode=${routingMode}&transportMode=${transportMode}&return=${returnType}`;
    
    const response = await axios.get(fullURL);
    res.json(response.data);
  } catch (error) {
    console.error("HERE API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch route from HERE API" });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
    minInstances: 0
  })
  .https
  .onRequest(app);

// Enhanced deleteUser function
exports.deleteUser = functions.https.onCall(async (data, context) => {
  console.log('Delete user request:', data);
  console.log('Auth context:', context.auth);

  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to delete users'
    );
  }

  if (context.auth.token.email !== 'mhabz1129@gmail.com') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an admin to delete users.'
    );
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID (uid) is required'
    );
  }

  try {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User document not found');
    }

    const userData = userDoc.data();
    const batch = admin.firestore().batch();

    // Delete from all collections
    const collections = ['locations', 'notes', 'photos'];
    const deletionResults = await Promise.all(
      collections.map(async collection => {
        const snapshot = await admin.firestore()
          .collection(collection)
          .where('userId', '==', uid)
          .get();
        
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        return { collection, count: snapshot.size };
      })
    );

    // Delete user document
    batch.delete(userDoc.ref);

    // Commit all Firestore deletions
    await batch.commit();

    // Delete from Authentication
    if (userData?.email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(userData.email);
        await admin.auth().deleteUser(userRecord.uid);
      } catch (authError) {
        console.error('Auth deletion error:', authError);
      }
    }

    return {
      success: true,
      message: 'User and related content deleted successfully',
      deletedCounts: Object.fromEntries(
        deletionResults.map(({ collection, count }) => [collection, count])
      )
    };

  } catch (error) {
    console.error('Delete user error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete user: ${error.message}`
    );
  }
});