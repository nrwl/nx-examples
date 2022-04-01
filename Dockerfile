FROM node:16-bullseye-slim

RUN apt-get update && \
  apt-get install --no-install-recommends -y wget \
  libaio1 \
  gnupg2 \
  xvfb \
  unzip \
  ca-certificates \
  netbase \
  vim \
  openssh-client \
  git \
  python3 \
  jq \
  unzip \
  curl \
  libcurl4 \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# install dumb-init
# https://engineeringblog.yelp.com/2016/01/dumb-init-an-init-for-docker.html
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64
RUN chmod +x /usr/local/bin/dumb-init

USER node

WORKDIR /home/node
RUN  mkdir /home/node/.cache

COPY --chown=node . ./app
# RUN yarn install --non-interactive --ignore-optional # runs out of space

VOLUME /home/node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node"]
