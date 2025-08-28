# Etapa de build
FROM node:16-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependência
COPY package*.json ./

# Limpar cache do npm e instalar dependências
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Etapa de produção
FROM nginx:alpine

# Remover arquivos padrão
RUN rm -rf /usr/share/nginx/html/*

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Criar arquivo de log do nginx
RUN touch /var/log/nginx/access.log
RUN touch /var/log/nginx/error.log

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
