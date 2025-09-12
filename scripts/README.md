# Scripts del Backend

Esta carpeta contiene todos los scripts de automatización para el proyecto.

## 📋 Scripts disponibles:

### **🚀 Scripts principales:**
- **`start.sh`** - Script principal para levantar todo el entorno Docker
- **`generate-env.sh`** - Genera archivo .env con credenciales aleatorias
- **`sync-env-template.sh`** - Sincroniza .env local con .env.template

### **🔍 Scripts de verificación:**
- **`verify-setup.sh`** - Verifica que todo el setup esté funcionando correctamente

### **🐳 Scripts internos de Docker:**
- **`docker-create-env.sh`** - Crea .env dentro del contenedor Docker
- **`docker-start.sh`** - Script de inicio para Docker (legacy)
- **`init-db.sh`** - Script de inicialización de base de datos (legacy)

## 🎯 Uso típico:

```bash
# 1. Sincronizar configuración local (solo cuando cambies .env)
yarn sync-env

# 2. Levantar todo el entorno
yarn setup-backend

# 3. Verificar que todo funcione
yarn verify-backend
```

## 📝 Notas:

- Todos los scripts tienen permisos de ejecución
- Los scripts están integrados con package.json
- Se mantiene compatibilidad con desarrollo local y Docker
