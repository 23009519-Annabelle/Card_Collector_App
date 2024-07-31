module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) { // Assuming you have req.isAuthenticated() implemented
            return next(); // User is authenticated, so proceed to the next middleware or route handler
        }
        res.redirect('/login'); // Not authenticated, redirect to login page
    }
};
