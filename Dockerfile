FROM node:18-alpine as builder

## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR app

COPY package-lock.json .
COPY package.json .

# rebuild from sources to avoid issues with prebuilt binaries (https://github.com/serialport/node-serialport/issues/2438
RUN npm ci --omit=dev && npm rebuild --build-from-source

ARG BUILD_FROM=hassioaddons/base:edge
# hadolint ignore=DL3006
FROM ${BUILD_FROM} as app

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /srv

## Copy built node modules and binaries without including the toolchain
COPY --from=builder app/node_modules ./srv/node_modules

COPY warema-bridge/ /

# # Build arguments
# ARG BUILD_ARCH
# ARG BUILD_DATE
# ARG BUILD_DESCRIPTION
# ARG BUILD_NAME
# ARG BUILD_REF
# ARG BUILD_REPOSITORY
# ARG BUILD_VERSION

# # Labels
# LABEL \
#     io.hass.name="${BUILD_NAME}" \
#     io.hass.description="${BUILD_DESCRIPTION}" \
#     io.hass.arch="${BUILD_ARCH}" \
#     io.hass.type="addon" \
#     io.hass.version=${BUILD_VERSION} \
#     maintainer="Franck Nijhof <frenck@addons.community>" \
#     org.opencontainers.image.title="${BUILD_NAME}" \
#     org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
#     org.opencontainers.image.vendor="Home Assistant Community Add-ons" \
#     org.opencontainers.image.authors="Franck Nijhof <frenck@addons.community>" \
#     org.opencontainers.image.licenses="MIT" \
#     org.opencontainers.image.url="https://addons.community" \
#     org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
#     org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
#     org.opencontainers.image.created=${BUILD_DATE} \
#     org.opencontainers.image.revision=${BUILD_REF} \
#     org.opencontainers.image.version=${BUILD_VERSION}
