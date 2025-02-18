import React, { useEffect, useState } from 'react';
import { 
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Divider,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import CompressIcon from '@mui/icons-material/Compress';

// Styled components
const WeatherCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(145deg, #1a237e, #0d47a1)'
    : 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
}));

const WeatherIcon = styled('img')({
  width: '80px',
  height: '80px',
  margin: '10px auto',
  display: 'block',
  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
});

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
  '& svg': {
    fontSize: '1.2rem',
  },
}));

const WeatherComponent = ({ userLocation }) => {
  const [weatherData, setWeatherData] = useState([]);

  const fetchWeatherData = async () => {
    if (userLocation) {
      const { lat, lng } = userLocation;
      const apiKey = '002a08b50c4638f5789f7667f34887ab';
      const weatherApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

      try {
        const response = await fetch(weatherApiUrl);
        const data = await response.json();

        if (data.cod !== "200") {
          console.error('Error:', data.message);
          setWeatherData([]);
          return;
        }

        if (data.list) {
          const formattedData = data.list.slice(0, 5).map((item) => ({
            date: new Date(item.dt_txt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            time: new Date(item.dt_txt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            temp: item.main.temp.toFixed(1),
            feels_like: item.main.feels_like.toFixed(1),
            humidity: item.main.humidity,
            wind_speed: (item.wind.speed * 3.6).toFixed(1), // Convert m/s to km/h
            pressure: item.main.pressure,
            description: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
            icon: item.weather[0].icon,
          }));
          setWeatherData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData([]);
      }
    }
  };

  useEffect(() => {
    if (userLocation) {
      fetchWeatherData();
    }
  }, [userLocation]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" sx={{ 
        mt: 4, 
        mb: 3,
        fontWeight: 'bold',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Weather Forecast
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3} justifyContent="center">
          {weatherData.length > 0 ? (
            weatherData.map((weather, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                <WeatherCard>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {weather.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {weather.time}
                      </Typography>
                      <WeatherIcon
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.description}
                      />
                      <Typography variant="h4" color="primary" align="center" sx={{ fontWeight: 'bold' }}>
                        {weather.temp}°C
                      </Typography>
                      <Typography variant="body1" color="text.secondary" align="center">
                        {weather.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Feels like: {weather.feels_like}°C
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Stack spacing={1}>
                        <DetailItem>
                          <WaterDropIcon color="primary" />
                          <Typography variant="body2">
                            Humidity: {weather.humidity}%
                          </Typography>
                        </DetailItem>
                        <DetailItem>
                          <AirIcon color="primary" />
                          <Typography variant="body2">
                            Wind: {weather.wind_speed} km/h
                          </Typography>
                        </DetailItem>
                        <DetailItem>
                          <CompressIcon color="primary" />
                          <Typography variant="body2">
                            Pressure: {weather.pressure} hPa
                          </Typography>
                        </DetailItem>
                      </Stack>
                    </Stack>
                  </CardContent>
                </WeatherCard>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                {[...Array(5)].map((_, index) => (
                  <Card sx={{ width: 250, m: 1 }} key={index}>
                    <CardContent>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', my: 2 }} />
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="rectangular" height={80} sx={{ mt: 2 }} />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default WeatherComponent;
