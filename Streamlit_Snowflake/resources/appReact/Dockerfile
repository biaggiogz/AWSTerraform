FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy pre-built static files directly
COPY public/assets ./assets
COPY public/index.html ./index.html

# Copy our app files
COPY src/app.js ./app.js
COPY src/index.css ./index.css

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]