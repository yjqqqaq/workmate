FROM node:16-alpine

WORKDIR /app

# 安装必要的软件包并创建docker组
RUN apk add --no-cache shadow su-exec && \
    addgroup -g 998 docker && \
    addgroup node docker

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]