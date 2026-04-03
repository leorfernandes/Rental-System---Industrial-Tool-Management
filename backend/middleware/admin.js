module.exports = (req, res, next) => {
    // Check if req.user exists (from auth middleware) and if role is Admin
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};