const logActivity = require('../utils/logActivity');

/**
 * Middleware that automatically logs activity on meaningful interactions.
 * Meaningful = successful POST, PUT, or DELETE request.
 */
function activityLogger(req, res, next) {
  // Capture original res.json to execute log string after successful response sent
  const originalJson = res.json;

  res.json = function (body) {
    // Only log if it's an authenticated mutating request
    if (req.user && ['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 400) {
      logActivity(req.user.id).catch(err => console.error("Activity log error:", err)); // Doesn't crash request
    }
    
    // Call the original res.json
    return originalJson.call(this, body);
  };
  
  next();
}

module.exports = activityLogger;
