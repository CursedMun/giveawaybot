FROM node:alpine

WORKDIR /usr/src/app

COPY ./package*.json ./
COPY ./yarn.lock ./
COPY ./nest-cli.json ./

RUN yarn install

COPY . .

CMD ["npm", "run", "start"]