const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
    try {
        // Check Authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            console.log('Missing Authorization header');
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        // Extract token
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        if (!token || token === 'null' || token === 'undefined') {
            console.log('Invalid token format:', token);
            return res.status(401).json({ message: 'Invalid token format' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                console.log('User not found for token ID:', decoded.id);
                return res.status(401).json({ message: 'User not found' });
            }
            
            // All good, attach user to request
            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({ message: 'Token verification failed' });
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = authenticateUser;