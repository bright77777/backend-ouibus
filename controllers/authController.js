const jwt = require('jsonwebtoken');


function verifyToken(req, res, next) {
  try {
    // Extraire le token de l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    // Vérifier si l'en-tête Authorization existe et commence par "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Invalid token format',
        error: 'Token must be provided in the format: Bearer <token>'
      });
    }

    // Extraire le token en supprimant le préfixe "Bearer "
    const token = authHeader.split(' ')[1];
    // Vérifier si le token est vide
    if (!token) {
      return res.status(403).json({ 
        message: 'No token provided',
        error: 'Authentication token is missing'
      });
    }

    // Vérifier le token avec des options supplémentaires
    jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Spécifier l'algorithme
      maxAge: '24h' // Durée de validité du token
    }, (err, decoded) => {
      if (err) {
        // Gérer différents types d'erreurs de token
        let errorMessage = 'Unauthorized';
        let statusCode = 401;

        switch (err.name) {
          case 'TokenExpiredError':
            errorMessage = 'Token has expired';
            statusCode = 401;
            break;
          case 'JsonWebTokenError':
            errorMessage = 'Invalid token';
            statusCode = 403;
            break;
          case 'NotBeforeError':
            errorMessage = 'Token not yet active';
            statusCode = 403;
            break;
          default:
            errorMessage = 'Authentication failed';
        }

        return res.status(statusCode).json({ 
          message: errorMessage,
          error: err.message
        });
      }
      req.user = {
        uid: decoded.uid,
        email: decoded.email
      };
      // Vérification supplémentaire (optionnel)
      if (decoded.disabled === true) {
        return res.status(403).json({ 
          message: 'Account disabled',
          error: 'Your account has been disabled'
        });
      }

      next();
    });
  } catch (error) {
    // Gestion des erreurs inattendues
    console.error('Token verification error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: 'An unexpected error occurred during authentication'
    });
  }
}

function generateTicketData(companies, cities, places) {
  const seatOptions = [50, 70, 75];
  const minPrice = 5000;
  const maxPrice = 10000;
  const minDiscount = 1;
  const maxDiscount = 20;
  const layouts = ['3-2', '3-2'];

  const ticketData = [];

  companies.forEach(company => {
    for (let i = 0; i < 2; i++) {
      const departurePlace = places[Math.floor(Math.random() * places.length)];
      const arrivalPlaces = places.filter(place => place.lieu !== departurePlace.lieu).sort(() => 0.5 - Math.random()).slice(0, 2);

      const totalSeats = seatOptions[Math.floor(Math.random() * seatOptions.length)];
      const price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      const discount = Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;
      const discountedPrice = price - (price * discount) / 100;

      const currentDate = new Date();
      const departureTime = new Date(currentDate.getTime() + Math.random() * 3600000 * 24);
      const arrivalTime = new Date(departureTime.getTime() + Math.random() * 3600000 * 5 + 2 * 3600000);

      ticketData.push({
        companyName: company,
        departure_companyDescription: {
          name1: `${company.toLowerCase()} ${cities[0]}`,
          position: departurePlace.position,
        },
        rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
        departureCity: cities[0],
        date_time: departureTime.toLocaleDateString(),
        departureTime: departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${Math.floor((arrivalTime - departureTime) / 3600000)}h ${Math.floor(((arrivalTime - departureTime) % 3600000) / 60000)}m`,
        arrivalCity: cities[1],
        arrival_companyDescription: {
          name1: `${company.toLowerCase()} ${cities[1]}`,
          position1: arrivalPlaces[0].position,
          position2: arrivalPlaces[1].position,
        },
        arrivalTime: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seatsAvailable: Math.floor(Math.random() * totalSeats)+1,
        discount,
        originalPrice: `XAF ${price}`,
        price: `XAF ${Math.ceil(discountedPrice)}`,
        options: {
          wifi: true,
          securitycamera: true,
          toilet: Math.random() > 0.5,
          airconditioning: true,
          poweroutlet: true,
          tv: true,
          Vipclass: Math.random() > 0.5,
          TotalSeats: totalSeats,
          plan: totalSeats > 40 ? layouts[1] : layouts[0],
        },
      });
    }
  });
  return ticketData;
}
const companies = [
  "General Express",
  "Global Express",
  "Buca Voyages",
  "Finexs Voyages",
  "Garanti Express",
  "Touristique Express",
  "Musango Voyages",
  "Moghamo Express",
  "Buca Express",
  "Garantie Express",
  "Amour Mezam Express",
];
module.exports=  { verifyToken, generateTicketData,companies};

