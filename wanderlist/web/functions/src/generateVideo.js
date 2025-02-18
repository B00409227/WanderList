const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const fetch = require('node-fetch');

// Set up FFmpeg paths
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const storage = new Storage();
const bucket = storage.bucket('wanderlist-59fb6.appspot.com');

// Update music track mapping to match actual file names
const MUSIC_TRACKS = {
  adventure: 'adventure-time.mp3',
  epic: 'epic-discovery.mp3',
  peaceful: 'peaceful-journey.mp3'
};

async function generateVideo(photos, options = {}) {
  console.log('Starting video generation with options:', JSON.stringify(options, null, 2));
  
  const settings = {
    duration: 3,
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 23,
    backgroundColor: 'black',
    musicTrack: 'adventure',
    musicVolume: 0.5,
    preset: 'medium',
    ...options,
    height: options.height || Math.round((options.width || 1920) * 9/16)
  };

  const tempDir = path.join(os.tmpdir(), `journey-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Download photos
    console.log('Downloading photos...');
    const photoFiles = await Promise.all(photos.map(async (photo, index) => {
      const response = await fetch(photo.url);
      const photoPath = path.join(tempDir, `photo_${index}.jpg`);
      fs.writeFileSync(photoPath, await response.buffer());
      console.log(`Photo ${index + 1} saved to:`, photoPath);
      return { path: photoPath, duration: photo.duration || settings.duration };
    }));

    // Setup music
    console.log('Setting up music track:', settings.musicTrack);
    const musicPath = path.join(tempDir, 'music.mp3');
    const musicFileName = MUSIC_TRACKS[settings.musicTrack];
    const localMusicPath = path.resolve(__dirname, '../assets/music/', musicFileName);
    fs.copyFileSync(localMusicPath, musicPath);
    console.log('Music file copied successfully');

    // Set up output path
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);
    console.log('Output path:', outputPath);

    // Generate video
    await new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Create a temporary file listing all inputs
      const inputListPath = path.join(tempDir, 'inputs.txt');
      const inputList = photoFiles.map(photo => 
        `file '${photo.path}'\nduration ${photo.duration}`
      ).join('\n');
      fs.writeFileSync(inputListPath, inputList);

      command
        .input(inputListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .input(musicPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-vf', `scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,` +
                 `pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2:${settings.backgroundColor}`,
          '-c:a', 'aac',
          '-af', `volume=${settings.musicVolume}`,
          '-preset', settings.preset,
          '-crf', settings.quality.toString(),
          '-r', settings.fps.toString(),
          '-shortest',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('start', commandLine => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', progress => {
          const percent = Math.min(Math.round(progress.percent || 0), 100);
          console.log('Processing:', percent, '% done');
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('FFmpeg processing finished');
          resolve();
        })
        .run();
    });

    // Upload to Firebase Storage
    console.log('Uploading to Firebase Storage...');
    const videoFileName = `videos/journey_${Date.now()}.mp4`;
    
    await bucket.upload(outputPath, {
      destination: videoFileName,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          firebaseStorageDownloadTokens: Date.now().toString()
        }
      }
    });

    // Get a signed URL
    const [signedUrl] = await bucket.file(videoFileName).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      version: 'v4'
    });

    console.log('Video uploaded successfully:', signedUrl);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Temporary files cleaned up');

    return { 
      success: true,
      videoUrl: signedUrl
    };

  } catch (error) {
    console.error('Error in video generation:', error);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw new Error(`Video generation failed: ${error.message}`);
  }
}

module.exports = { generateVideo }; 