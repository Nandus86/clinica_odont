FROM node:16-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copiar apenas package.json primeiro (para cache de layer)
COPY package*.json ./

# Remover package-lock.json se houver problemas
RUN rm -f package-lock.json

# Configurar npm para evitar problemas
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fund false
RUN npm config set audit false

# Instalar dependências com flags mais permissivas
RUN npm install --legacy-peer-deps --no-optional --force

# Copiar o resto dos arquivos
COPY . .

# Fazer build da aplicação
RUN npm run build

# Instalar serve globalmente para servir a aplicação
RUN npm install -g serve

# Expor porta 80
EXPOSE 80

# Comando para servir a aplicação
CMD ["serve", "-s", "dist", "-l", "80", "--host", "0.0.0.0"]
