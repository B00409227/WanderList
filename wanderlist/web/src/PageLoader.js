import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const PageLoader = () => {
  const [fact, setFact] = useState({ text: "Did you know?", category: "intro" });
  const [showCategory, setShowCategory] = useState(true);

  // Categorized fun facts
  const facts = {
    space: [
      "A day on Venus is longer than its year",
      "Space smells like seared steak",
      "The moon has moonquakes",
      "A black hole's edge is called the event horizon",
      "Saturn could float in water because it's mostly gas"
    ],
    nature: [
      "Honeybees can recognize human faces",
      "Octopuses have three hearts",
      "Sloths can hold their breath for 40 minutes underwater",
      "Hummingbirds are the only birds that can fly backwards",
      "Giraffes have the same number of neck vertebrae as humans"
    ],
    science: [
      "Honey never spoils. Ever.",
      "A cloud can weigh more than a million pounds",
      "Glass is actually a liquid, just a very slow-moving one",
      "Bananas are naturally radioactive",
      "Lightning strikes Earth about 100 times per second"
    ],
    history: [
      "The first oranges weren't orange",
      "Ancient Romans used crushed mouse brains as toothpaste",
      "The shortest war lasted only 38 minutes",
      "Cleopatra lived closer to the invention of the iPhone than to the building of pyramids",
      "The first computer programmer was a woman - Ada Lovelace"
    ],
    tech: [
      "The first computer mouse was made of wood",
      "The first webpage is still online",
      "Email is older than the internet",
      "The most common password is '123456'",
      "The first YouTube video was about elephants"
    ]
  };

  // Get random fact from random category
  const getRandomFact = () => {
    const categories = Object.keys(facts);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryFacts = facts[randomCategory];
    const randomFact = categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
    return { text: randomFact, category: randomCategory };
  };

  useEffect(() => {
    const changeFact = () => {
      setShowCategory(false);
      setTimeout(() => {
        const newFact = getRandomFact();
        setFact(newFact);
        setShowCategory(true);
      }, 500);
    };

    const intervalId = setInterval(changeFact, 4000);
    return () => clearInterval(intervalId);
  }, []);

  const getCategoryColor = (category) => {
    const colors = {
      space: '#8B5CF6',
      nature: '#10B981',
      science: '#3B82F6',
      history: '#F59E0B',
      tech: '#EC4899'
    };
    return colors[category] || '#ED64A6';
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        bgcolor: '#121212',
        zIndex: 1100,
        gap: 4,
        overflow: 'hidden',
        padding: 3
      }}
    >
      {/* Animated background patterns */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 20%, ${getCategoryColor(fact.category)} 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${getCategoryColor(fact.category)} 0%, transparent 50%)
          `,
          animation: 'gradientMove 8s ease infinite',
          '@keyframes gradientMove': {
            '0%': { transform: 'rotate(0deg) scale(1)' },
            '50%': { transform: 'rotate(180deg) scale(1.5)' },
            '100%': { transform: 'rotate(360deg) scale(1)' }
          }
        }}
      />

      {/* Main loading animation */}
      <Box
        sx={{
          position: 'relative',
          mb: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress 
          size={100}
          thickness={2}
          sx={{ 
            color: getCategoryColor(fact.category),
            transition: 'color 0.5s ease'
          }} 
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute'
          }}
        >
          <AutoAwesomeIcon 
            sx={{ 
              fontSize: 40,
              color: getCategoryColor(fact.category),
              transition: 'color 0.5s ease'
            }} 
          />
        </motion.div>
      </Box>

      {/* Category badge */}
      <AnimatePresence mode="wait">
        {showCategory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                bgcolor: `${getCategoryColor(fact.category)}20`,
                color: getCategoryColor(fact.category),
                px: 2,
                py: 0.5,
                borderRadius: 2,
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                letterSpacing: 1,
                mb: 2,
                border: `1px solid ${getCategoryColor(fact.category)}40`,
              }}
            >
              {fact.category}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fun fact text */}
      <Box
        sx={{
          maxWidth: '600px',
          textAlign: 'center'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={fact.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500,
                letterSpacing: '0.5px',
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                lineHeight: 1.6,
                textShadow: `0 0 20px ${getCategoryColor(fact.category)}40`,
              }}
            >
              {fact.text}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Loading indicator dots */}
      <Box sx={{ display: 'flex', gap: 1, mt: 4 }}>
        {[...Array(3)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: getCategoryColor(fact.category),
              transition: 'background-color 0.5s ease'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PageLoader;
