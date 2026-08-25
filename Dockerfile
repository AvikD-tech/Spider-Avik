FROM node:18-alpine

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies using npm install (no lockfile needed)
RUN npm install

# Copy rest of the files
COPY . .

EXPOSE 10000

CMD ["node", "index.js"]
