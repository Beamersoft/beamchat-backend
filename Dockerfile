FROM node:latest
RUN mkdir -p /home/beamchat
WORKDIR /home/beamchat
COPY . .
RUN npm install
RUN npm install nodemon -g
EXPOSE 3500
CMD ["nodemon", "index.js"]
