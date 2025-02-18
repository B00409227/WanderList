const express = require('express');
const axios = require('axios');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const generateVideo = require('./functions/src/generateVideo');


const app = express();
const PORT = process.env.PORT || 5000;

// Music files mapping
const MUSIC_FILES = {
  peaceful: path.join(__dirname, 'public', 'music', 'peaceful-journey.mp3'),
  adventure: path.join(__dirname, 'public', 'music', 'adventure-time.mp3'),
  epic: path.join(__dirname, 'public', 'music', 'epic-discovery.mp3')
};

// Middleware
app.use(cors({
  origin: ' http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir()
}));
app.use(express.static('public'));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' chrome-extension:;");
  next();
});

// Route for getting the route from HERE API
app.get('/api/route', async (req, res) => {
  // Extract query parameters from request
  const { origin, destination, routingMode, transportMode, return: returnType, via } = req.query;
  
  // Your HERE API key
  const HERE_API_KEY = 'zl2Vm_Hz44SDiTvTO0EnGm7A0j0SoBmDLCEJeUnUajQ';  

  // Handle 'via' points if it's an array
  let viaWaypoints = '';
  if (via) {
    if (Array.isArray(via)) {
      viaWaypoints = via.map(point => `&via=${point}`).join('');
    } else {
      viaWaypoints = `&via=${via}`;
    }
  }

  // Construct the full URL for HERE API request
  const fullURL = `https://router.hereapi.com/v8/routes?apikey=${HERE_API_KEY}&origin=${origin}&destination=${destination}${viaWaypoints}&routingMode=${routingMode}&transportMode=${transportMode}&return=${returnType}`;

  console.log("HERE API URL:", fullURL);  // Log the URL for debugging

  try {
    // Make the request to HERE API
    const response = await axios.get(fullURL);
    
    // Send the successful response data back to the frontend
    res.json(response.data);

  } catch (error) {
    // Detailed logging if there is an error from HERE API
    if (error.response) {
      console.error("HERE API Error:", error.response.data);  // Error from HERE API
    } else {
      console.error("Error fetching route from HERE API:", error.message);  // General error
    }
    // Send a 500 status with error message
    res.status(500).json({ error: "Failed to fetch route from HERE API" });
  }
});

// Video generation endpoint
app.post('/api/generate-video', async (req, res) => {
  console.log('Received video generation request:', req.body);
  
  try {
    const {
      photos,
      duration,
      transition,
      width,
      height,
      fps,
      quality,
      backgroundColor,
      zoomDirection,
      zoomRate,
      musicTrack,
      musicVolume,
      preset
    } = req.body;

    // Validate required fields
    if (!photos || !photos.length) {
      console.error('No photos provided in request');
      return res.status(400).json({ error: 'No photos provided' });
    }

    if (!photos.every(photo => photo.url)) {
      console.error('Invalid photo data - missing URLs');
      return res.status(400).json({ error: 'Invalid photo data - missing URLs' });
    }

    const outputDir = path.join(os.tmpdir(), 'journey-videos');
    const outputFileName = `journey-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create temp directory for photos
    const tempDir = path.join(os.tmpdir(), `journey-temp-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    console.log('Created temp directory:', tempDir);
    
    // Download photos
    const photoFiles = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoPath = path.join(tempDir, `photo-${i}.jpg`);
      
      try {
        console.log(`Downloading photo ${i} from:`, photo.url);
        
        // Download photo
        const response = await axios({
          method: 'get',
          url: photo.url,
          responseType: 'stream'
        });
        
        // Save to temp file
        const writer = fs.createWriteStream(photoPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        console.log(`Successfully downloaded photo ${i} to:`, photoPath);
        
        photoFiles.push({
          path: photoPath,
          name: `photo-${i}.jpg`
        });
      } catch (error) {
        console.error(`Error downloading photo ${i}:`, error);
        throw new Error(`Failed to download photo ${i}: ${error.message}`);
      }
    }

    try {
      console.log('Starting video generation with settings:', {
        duration,
        transition,
        width,
        height,
        fps,
        quality,
        backgroundColor,
        zoomDirection,
        zoomRate,
        musicTrack,
        musicVolume,
        preset
      });

      // Generate video using the new script
      await generateVideo(photoFiles, {
        duration,
        transition,
        width,
        height,
        fps,
        quality,
        backgroundColor,
        zoomDirection,
        zoomRate,
        musicTrack,
        musicVolume,
        preset,
        outputPath
      });

      console.log('Video generated successfully at:', outputPath);

      // Stream the video file
      const stat = fs.statSync(outputPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size
      });
      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);

      // Delete the video file and temp directory after streaming
      readStream.on('end', () => {
        console.log('Cleaning up temporary files...');
        
        // Delete output video
        try {
          fs.unlinkSync(outputPath);
          console.log('Deleted output video:', outputPath);
        } catch (err) {
          console.error('Error deleting output video:', err);
        }
        
        // Clean up temp directory
        photoFiles.forEach(photo => {
          try {
            fs.unlinkSync(photo.path);
            console.log('Deleted temp photo:', photo.path);
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }
        });
        
        try {
          fs.rmdirSync(tempDir);
          console.log('Deleted temp directory:', tempDir);
        } catch (err) {
          console.error('Error removing temp directory:', err);
        }
      });
    } catch (error) {
      console.error('Error generating video:', error);
      res.status(500).json({ error: `Failed to generate video: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in video generation request:', error);
    res.status(500).json({ error: `Failed to process video generation request: ${error.message}` });
  }
});

// Start the backend server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
