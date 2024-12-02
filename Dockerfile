#
# BASE
#
FROM scratch

#
# BUILD
#
FROM node:16-alpine3.14
WORKDIR /var/app

ADD package.json .
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

#
# UNIT TESTING
#
FROM node:16-alpine3.14

ARG UNIT_TEST=no
WORKDIR /var/app

COPY --from=1 /var/app  /var/app

RUN if [ "${UNIT_TEST}" = "yes" ]; then \
    echo "**** UNIT TESTING ****"; \
    npm test; \
    fi

#
# RUNTIME
#
FROM node:8
EXPOSE 3000
ENV ENV_NAME=${ENV_NAME}

RUN addgroup pwcapp \
    && adduser --home /var/app --ingroup pwcapp --gecos 'PwC' --disabled-password pwcapp

WORKDIR /var/app

COPY --from=1 /var/app/package.json .
COPY --from=1 /var/app/.npmrc .
COPY --from=1 /var/app/build .
COPY --from=1 /var/app/docs ./docs/

RUN chown -R pwcapp:pwcapp /var/app

USER pwcapp 
RUN npm install --production --legacy-peer-deps

ENTRYPOINT ["npm", "start"]
