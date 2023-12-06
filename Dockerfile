###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18-alpine As development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# 와일드카드를 사용하여 package.json과 package-lock.json(사용 가능한 경우)을 모두 복사
# 이미지 빌드 과정에서 종속성을 미리 설치하여, 코드가 변경될 때마다 매번 npm install 명령을 다시 실행하는 것을 방지.
COPY --chown=node:node package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# `npm run build`를 실행하기 위해서는 Nest CLI에 액세스해야 함. Nest CLI는 개발 의존성으로 설치되어 있음. 이전 개발 스테이지에서는 `npm ci`를 실행하여 모든 종속성을 설치했기 때문에, 개발 이미지에서 node_modules 디렉터리를 복사하여 사용할 수 있음.
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# `npm ci`를 실행하면 기존의 node_modules 디렉터리가 삭제되며, --only=production을 전달함으로써 오직 프로덕션에 필요한 종속성만이 설치됨. node_modules 디렉터리가 최대한 최적화되도록 보장.
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
