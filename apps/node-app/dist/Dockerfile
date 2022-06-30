FROM node:lts-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV VERBOSE=false

COPY . /usr/src/app/

CMD ["node", "main.js"]

EXPOSE 443
