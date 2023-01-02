FROM node:18-alpine as builder

## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR app

COPY rootfs/srv/package-lock.json .
COPY rootfs/srv/package.json .

# rebuild from sources to avoid issues with prebuilt binaries (https://github.com/serialport/node-serialport/issues/2438
RUN npm ci --omit=dev && npm rebuild --build-from-source

FROM node:18-alpine as app

## Copy built node modules and binaries without including the toolchain
COPY --from=builder app/node_modules ./node_modules

# Copy root filesystem
COPY rootfs/srv/index.js .
COPY rootfs/srv/warema-wms-venetian-blinds warema-wms-venetian-blinds

CMD ["node", "index.js"]
