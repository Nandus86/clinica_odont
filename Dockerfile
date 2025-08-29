# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install --omit=dev

# Copia todo o código fonte
COPY . .

# Faz o build da aplicação
RUN npm run build

# Etapa de produção
FROM nginx:alpine

# Copia os arquivos buildados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
