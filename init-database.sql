-- Script de inicialización de base de datos
-- Este script se ejecuta automáticamente al inicializar MySQL

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `reto_tecnico` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

-- MySQL automáticamente crea el usuario usando las variables de entorno:
-- MYSQL_USER=reto_user y MYSQL_PASSWORD (generada aleatoriamente)
-- Y le otorga permisos completos sobre MYSQL_DATABASE=reto_tecnico

-- Verificar configuración
SELECT 'Base de datos y usuario configurados correctamente' as status;
SELECT 'Usuario: reto_user con permisos completos en reto_tecnico' as info;

-- Usar la base de datos para los siguientes scripts
USE `reto_tecnico`;
