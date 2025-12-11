# Guía de Despliegue a AWS

## Requisitos Previos
- Clave SSH: `/home/dhcu/Desarrollo/api_ventas/api_ventas_ssh.pem`
- IP del servidor: `13.59.121.99`

---

## Comandos Rápidos

### 1. Desplegar Solo Backend
```bash
cd /home/dhcu/Desarrollo/api_ventas

# Empaquetar y subir
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf backend.tar.gz backend && \
scp -i api_ventas_ssh.pem backend.tar.gz ubuntu@13.59.121.99:~/ && \
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "tar -xzf ~/backend.tar.gz -C ~/api_ventas && cd ~/api_ventas && sudo docker compose -f docker-compose.prod.yml up -d --build backend"
```

### 2. Desplegar Solo Frontend
```bash
cd /home/dhcu/Desarrollo/api_ventas

tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf frontend.tar.gz frontend && \
scp -i api_ventas_ssh.pem frontend.tar.gz ubuntu@13.59.121.99:~/ && \
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "tar -xzf ~/frontend.tar.gz -C ~/api_ventas && cd ~/api_ventas && sudo docker compose -f docker-compose.prod.yml up -d --build frontend"
```

### 3. Desplegar Todo (Backend + Frontend + Nginx)
```bash
cd /home/dhcu/Desarrollo/api_ventas

# Empaquetar todo
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf deploy.tar.gz backend frontend docker-compose.prod.yml nginx-lb && \
scp -i api_ventas_ssh.pem deploy.tar.gz ubuntu@13.59.121.99:~/ && \
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "tar -xzf ~/deploy.tar.gz -C ~/api_ventas && cd ~/api_ventas && sudo docker compose -f docker-compose.prod.yml up -d --build"
```

---

## Comandos de Diagnóstico

### Ver logs del backend
```bash
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "sudo docker logs api_ventas-backend-1 --tail 50"
```

### Ver estado de contenedores
```bash
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "sudo docker ps"
```

### Reiniciar servicios
```bash
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "cd ~/api_ventas && sudo docker compose -f docker-compose.prod.yml restart"
```

### Forzar reconstrucción sin caché
```bash
ssh -i api_ventas_ssh.pem ubuntu@13.59.121.99 "cd ~/api_ventas && sudo docker compose -f docker-compose.prod.yml build --no-cache && sudo docker compose -f docker-compose.prod.yml up -d"
```

---

## URLs de Acceso
- **Frontend:** http://13.59.121.99
- **API Backend:** http://13.59.121.99/api
