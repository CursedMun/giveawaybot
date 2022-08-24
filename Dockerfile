FROM node:alpine

WORKDIR /usr/src/app

COPY ./package*.json ./
COPY ./nest-cli.json ./

RUN yarn install

COPY . .

CMD ["npm", "run", "start"]