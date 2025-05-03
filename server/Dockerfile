# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Create necessary directories
RUN mkdir -p public/profilepic log

# Set permissions for directories
RUN chmod -R 755 public log

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]