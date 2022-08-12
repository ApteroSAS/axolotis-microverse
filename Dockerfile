FROM node:16-alpine
RUN apk add git
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install
COPY . .
RUN yarn run build

FROM nginx:1.21.3-alpine
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=0 ./dist/ /usr/share/nginx/html/
