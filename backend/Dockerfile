FROM node:lts

RUN apt-get update && apt-get install -y 

# Create app directory
WORKDIR /app

# Install app dependencies

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]