/**
 * @file Defines the main auth lib.
 * @module lib/auth
 * @author Jennifer von Trotta-Treyden <jv222th@student.lnu.se>
 * @version 1.0.0
 */

export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    // Check if the token matches the API key from environment variables
    // Keep this as a static secret key for now, in the future consider using a personalized key for each user or a more secure authentication method.
    if (token !== process.env.API_KEY) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    next()
}