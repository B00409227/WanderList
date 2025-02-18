const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Music file mapping
const MUSIC_FILES = {
  'peaceful': 'peaceful-journey.mp3',
  'adventure': 'adventure-time.mp3',
  'epic': 'epic-discovery.mp3'
};

// Default video settings
const DEFAULT_SETTINGS = {
  duration: 5,                    // Duration per photo in seconds
  transition: 'slide',           // Transition type: 'slide', 'fade', 'zoom'
  transitionDuration: 1,         // Duration of transition effect in seconds
  width: 1280,                   // Output video width
  height: 720,                   // Output video height
  fps: 25,                       // Frames per second
  quality: 23,                   // CRF value (0-51, lower is better quality)
  backgroundColor: 'black',      // Background color for padding
  zoomDirection: 'in',           // Zoom direction: 'in' or 'out'
  zoomRate: 0.0015,             // Speed of zoom effect
  format: 'mp4',                // Output format
  musicVolume: 0.5,             // Background music volume (0-1)
  preset: 'medium'              // FFmpeg preset: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
};

async function generateVideo(photos, options) {
  // Merge default settings with provided options
  const settings = { ...DEFAULT_SETTINGS, ...options };
  console.log('Starting video generation with:', settings);
  
  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `journey-temp-${Date.now()}`);
  console.log('Creating temp directory:', tempDir);
  fs.mkdirSync(tempDir, { recursive: true });

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(settings.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Process photos - we now expect photos to be an array of objects with path property
    console.log('Processing photos...');
    const photoFiles = photos.map(photo => photo.path);
    
    // Verify all photos
    console.log('Verifying all photos...');
    for (let i = 0; i < photoFiles.length; i++) {
      if (fs.existsSync(photoFiles[i])) {
        const stats = fs.statSync(photoFiles[i]);
        console.log(`Photo ${i} verified at: ${photoFiles[i]} (${stats.size} bytes)`);
      } else {
        throw new Error(`Photo ${i} not found at ${photoFiles[i]}`);
      }
    }

    // Check if music file exists
    const musicFileName = MUSIC_FILES[settings.musicTrack];
    if (!musicFileName) {
      throw new Error(`Invalid music track: ${settings.musicTrack}`);
    }
    const musicPath = path.join(__dirname, '..', '..', 'public', 'music', musicFileName);
    console.log('Checking for music file:', musicPath);
    if (!fs.existsSync(musicPath)) {
      throw new Error(`Music file not found: ${musicPath}`);
    }
    console.log('Music file found');

    // Build ffmpeg command
    const args = [
      '-y', // Overwrite output file
    ];

    // Add input photos with loop
    photoFiles.forEach(photo => {
      args.push('-loop', '1', '-t', settings.duration.toString(), '-i', photo);
    });

    // Add music
    args.push('-i', musicPath);

    // Build filter complex
    const filters = [];
    
    // Scale and pad each input
    photoFiles.forEach((_, i) => {
      filters.push(`[${i}:v]scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,setsar=1:1,pad=${settings.width}:${settings.height}:-1:-1:color=${settings.backgroundColor}[v${i}]`);
    });

    // Add transitions based on type
    if (settings.transition === 'slide') {
      // Handle single photo case
      if (photoFiles.length === 1) {
        filters.push(`[v0]copy[outv]`);
      } else {
        // Create slide transitions between each pair of videos
        for (let i = 0; i < photoFiles.length - 1; i++) {
          if (i === 0) {
            filters.push(`[v${i}][v${i + 1}]xfade=transition=slideleft:duration=${settings.transitionDuration}:offset=${settings.duration}[xf${i}]`);
          } else if (i === photoFiles.length - 2) {
            filters.push(`[xf${i-1}][v${i + 1}]xfade=transition=slideleft:duration=${settings.transitionDuration}:offset=${settings.duration}[outv]`);
          } else {
            filters.push(`[xf${i-1}][v${i + 1}]xfade=transition=slideleft:duration=${settings.transitionDuration}:offset=${settings.duration}[xf${i}]`);
          }
        }
      }
    } else if (settings.transition === 'zoom') {
      // Apply zoom effect to each video
      photoFiles.forEach((_, i) => {
        const zoomExpression = settings.zoomDirection === 'out' 
          ? `'if(lte(zoom,1.0),1.5,zoom-${settings.zoomRate})'`
          : `'min(zoom+${settings.zoomRate},1.5)'`;
        filters.push(`[v${i}]zoompan=z=${zoomExpression}:d=${settings.duration * settings.fps}:s=${settings.width}x${settings.height}[z${i}]`);
      });
      
      // Concatenate all zoomed videos
      filters.push(`${photoFiles.map((_, i) => `[z${i}]`).join('')}concat=n=${photoFiles.length}:v=1:a=0[outv]`);
    } else {
      // Default fade transition
      if (photoFiles.length === 1) {
        // If there's only one photo, just use it directly
        filters.push(`[v0]copy[outv]`);
      } else {
        // Create fade transitions between each pair of videos
        const lastIndex = photoFiles.length - 1;
        if (lastIndex === 1) {
          // Special case for exactly two photos
          filters.push(`[v0][v1]xfade=transition=fade:duration=${settings.transitionDuration}:offset=${settings.duration}[outv]`);
        } else {
          // More than two photos
          for (let i = 0; i < lastIndex; i++) {
            if (i === 0) {
              filters.push(`[v${i}][v${i + 1}]xfade=transition=fade:duration=${settings.transitionDuration}:offset=${settings.duration}[xf${i}]`);
            } else if (i === lastIndex - 1) {
              filters.push(`[xf${i-1}][v${i + 1}]xfade=transition=fade:duration=${settings.transitionDuration}:offset=${settings.duration}[outv]`);
            } else {
              filters.push(`[xf${i-1}][v${i + 1}]xfade=transition=fade:duration=${settings.transitionDuration}:offset=${settings.duration}[xf${i}]`);
            }
          }
        }
      }
    }

    // Calculate total video duration including transitions
    const totalDuration = photoFiles.length * settings.duration + (photoFiles.length - 1) * settings.transitionDuration;
    console.log('Total video duration:', totalDuration);

    // Add audio processing - trim to video duration and add fade out
    filters.push(`[${photoFiles.length}:a]volume=${settings.musicVolume},atrim=0:${totalDuration},afade=t=out:st=${totalDuration-2}:d=2[outa]`);

    // Add filter complex
    args.push('-filter_complex', filters.join(';'));

    // Add output mapping
    args.push('-map', '[outv]', '-map', '[outa]');

    // Add output options
    args.push(
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-preset', settings.preset,
      '-crf', settings.quality.toString(),
      '-movflags', '+faststart',
      '-r', settings.fps.toString(),
      '-aspect', '16:9',
      '-pix_fmt', 'yuv420p'
    );

    // Add output path
    args.push(settings.outputPath);

    // Log the command
    console.log('FFmpeg command:', [ffmpeg, ...args].join(' '));

    // Run ffmpeg
    console.log('Starting ffmpeg process...');
    return new Promise((resolve, reject) => {
      const process = spawn(ffmpeg, args);
      let ffmpegError = '';

      process.stdout.on('data', (data) => {
        console.log(`ffmpeg stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        ffmpegError += data.toString();
        console.log(`ffmpeg stderr: ${data}`);
      });

      process.on('close', (code) => {
        console.log('FFmpeg process closed with code:', code);
        
        if (code !== 0) {
          console.error('FFmpeg error output:', ffmpegError);
        }
        
        // Clean up temp directory
        console.log('Cleaning up temp directory:', tempDir);
        for (const file of photoFiles) {
          console.log('Deleting temp file:', file);
          try {
            fs.unlinkSync(file);
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }
        }
        try {
          fs.rmdirSync(tempDir);
          console.log('Temp directory cleaned up');
        } catch (err) {
          console.error('Error removing temp directory:', err);
        }

        if (code === 0) {
          resolve(settings.outputPath);
        } else {
          reject(new Error(`FFmpeg process failed with code ${code}. Error: ${ffmpegError}`));
        }
      });

      process.on('error', (err) => {
        console.error('FFmpeg process error:', err);
        reject(err);
      });
    });
  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    throw error;
  }
}

module.exports = generateVideo; 