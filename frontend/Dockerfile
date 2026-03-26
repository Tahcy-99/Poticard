FROM node:24.13.0-slim AS builder
WORKDIR /app

#ARG VITE_BACKEND_URL
#ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

COPY ./package.json ./

RUN npm install ./

COPY ./ ./
RUN npm run build

FROM nginx:latest

ARG LOCAL_URL
ENV LOCAL_URL=${LOCAL_URL}

COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/www/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]