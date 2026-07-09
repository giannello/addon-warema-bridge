FROM ghcr.io/home-assistant/base:latest

# Copy root filesystem
COPY rootfs /

# Install requirements for app
RUN \
  apk add --no-cache \
    nodejs npm
RUN \
  npm install -g @wms-js/mqtt-bridge

ENTRYPOINT ["npx", "@wms-js/mqtt-bridge"]
