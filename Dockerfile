FROM node:6.10
EXPOSE 3000
WORKDIR /src
ADD . /src
CMD npm start
