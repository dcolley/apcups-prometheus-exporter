FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# ARG PORT=3000
ARG UPS_HOST=192.168.40.3
ARG UPS_PORT=3551
ARG PROM_PREFIX=apc_ups

# RUN echo 'PORT="$PORT"' >> .env
RUN echo "UPS_HOST is $UPS_HOST"
RUN echo "UPS_HOST=\"$UPS_HOST\"" >> .env
RUN echo "UPS_PORT=\"$UPS_PORT\"" >> .env
RUN echo "PROM_PREFIX=\"$PROM_PREFIX\"" >> .env

EXPOSE 3000

CMD [ "node", "exporter.js" ]
