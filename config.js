// Import all env vars from .env file
require('dotenv').config()
export const MY_SECRET_KEY = process.env.MY_SECRET_KEY
console.log(MY_SECRET_KEY) // => Hello