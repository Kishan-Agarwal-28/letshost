FROM node:lts

RUN apt-get update && apt-get install -y

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD [ "node", "index.js" ]