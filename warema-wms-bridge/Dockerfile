FROM ghcr.io/home-assistant/base:latest

# Install requirements for app
RUN \
  apk add --no-cache \
    nodejs npm
RUN \
  npm install -g @wms-js/mqtt-bridge

ENTRYPOINT ["npx", "@wms-js/mqtt-bridge"]
