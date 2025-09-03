# Use official Node.js 18 image as base (includes npm)
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This allows Docker to cache 'npm install' step if dependencies don't change
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy all remaining project files into the container
COPY . .

# Expose port 3000 to the outside world (should match your Express server)
EXPOSE 3000

# Define the command to run your app
# Adjust 'server.js' if your entry file is named differently
CMD ["node", "server.js"]
