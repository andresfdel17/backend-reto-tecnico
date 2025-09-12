-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 12-09-2025 a las 20:17:32
-- Versión del servidor: 8.3.0
-- Versión de PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `reto_tecnico`
--

-- --------------------------------------------------------
-- Estructura de datos para la base de datos reto_tecnico
-- La base de datos ya fue creada en 01-init.sql
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `main_roles`
--

CREATE TABLE `main_roles` (
  `id` int NOT NULL,
  `code` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'nombre a usar con el diccionario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_roles`
--

INSERT INTO `main_roles` (`id`, `code`, `name`) VALUES
(1, 1, 'admin'),
(2, 2, 'user');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `main_users`
--

CREATE TABLE `main_users` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` text COLLATE utf8mb4_general_ci,
  `rol_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_users`
--

INSERT INTO `main_users` (`id`, `name`, `email`, `password`, `rol_id`) VALUES
(1, 'Andrés Felipe Delgado', 'andresfdel13@gmail.com', '$2y$10$m1tCyWFHFcrJamIKUS1kLeF621XjPsF.X/vZNUncow2VbRrpA0lDa', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `main_roles`
--
ALTER TABLE `main_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `main_users`
--
ALTER TABLE `main_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_rol` (`rol_id`),
  ADD KEY `usr_email_index` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `main_roles`
--
ALTER TABLE `main_roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `main_users`
--
ALTER TABLE `main_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `main_users`
--
ALTER TABLE `main_users`
  ADD CONSTRAINT `id_rol` FOREIGN KEY (`rol_id`) REFERENCES `main_roles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;
