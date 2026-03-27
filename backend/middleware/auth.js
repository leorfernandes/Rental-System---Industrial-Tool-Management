const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
    const token = req.header('x-auth-token');
    
    // 1. Check if token exists
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Add user from payload to request object
        req.user = decoded;
        
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};