ARG BUILD_FROM=alpine:3.13.2
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Setup base
# hadolint ignore=DL3003
RUN \
    apk add --no-cache --virtual .build-deps python3 make g++ linux-headers
RUN \
    apk add --no-cache npm

# Copy root filesystem
COPY rootfs/srv/package-lock.json /srv
COPY rootfs/srv/package.json /srv

WORKDIR /srv

RUN npm ci

RUN apk del --no-cache --purge .build-deps && rm -rf /root/.npm /root/.cache

COPY rootfs/srv /srv

ENTRYPOINT ["/usr/bin/node", "/srv/bridge.js"]
