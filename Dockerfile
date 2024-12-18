FROM node:18.19.1
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD [ "node","server.js" ]