-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 15-09-2025 a las 21:00:19
-- Versión del servidor: 8.3.0
-- Versión de PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `reto_tecnico`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `main_drivers`
--

CREATE TABLE `main_drivers` (
  `id` int NOT NULL,
  `cifnif` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_drivers`
--

INSERT INTO `main_drivers` (`id`, `cifnif`, `name`) VALUES
(1, '12345678', 'Juan cano'),
(2, '123456789', 'Jose Pekerman'),
(3, '98765432', 'Camilo Vargas');

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
-- Estructura de tabla para la tabla `main_routes`
--

CREATE TABLE `main_routes` (
  `id` int NOT NULL,
  `vehicle_id` int DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `desc_route` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_routes`
--

INSERT INTO `main_routes` (`id`, `vehicle_id`, `code`, `desc_route`) VALUES
(1, NULL, 'COL001', 'De sur a norte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `main_sends`
--

CREATE TABLE `main_sends` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `unique_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `route_id` int DEFAULT NULL,
  `driver_id` int DEFAULT NULL,
  `reference` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `units` int DEFAULT NULL,
  `state` int DEFAULT NULL COMMENT '1-En espera,2-en tránsito,3-Entregado,4-cancelado',
  `create_datetime` datetime DEFAULT NULL,
  `transit_datetime` datetime DEFAULT NULL,
  `deliver_datetime` datetime DEFAULT NULL,
  `width` float DEFAULT NULL,
  `height` float DEFAULT NULL,
  `length` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_sends`
--

INSERT INTO `main_sends` (`id`, `user_id`, `unique_id`, `route_id`, `driver_id`, `reference`, `address`, `units`, `state`, `create_datetime`, `transit_datetime`, `deliver_datetime`, `width`, `height`, `length`) VALUES
(1, 2, '12345678', NULL, NULL, 'TEST', 'Callee busquela con cra encuentrela', 1, 1, '2025-09-13 19:11:36', NULL, NULL, NULL, NULL, NULL),
(14, 1, '1757886110943', NULL, NULL, 'saldnslad', 'Cll 30 # 30  - 50 Armenia', 1, 1, '2025-09-14 16:41:50', NULL, NULL, 10, 10, 10),
(15, 2, '1757886190142', NULL, NULL, 'sadsdasd', 'Cll 30 # 50 - 30 Armenia', 1, 4, '2025-09-14 16:43:10', NULL, NULL, 10, 10, 10);

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
(1, 'admin_user', 'a@mail.com', '$2y$10$m1tCyWFHFcrJamIKUS1kLeF621XjPsF.X/vZNUncow2VbRrpA0lDa', 1),
(2, 'user', 'afd@mail.com', '$2b$12$i0CFnw5IIBWhPaA/CMudfeeeYTecEG5DvB89JXFljd7qrD5qlD8r2', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `main_vehicles`
--

CREATE TABLE `main_vehicles` (
  `id` int NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `brand` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL COMMENT 'Se pone en cantidad de paquetes, para fines prácticos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `main_vehicles`
--

INSERT INTO `main_vehicles` (`id`, `code`, `brand`, `capacity`) VALUES
(1, '001', 'Turbo', 15),
(2, '002', 'Chevrolet', 2);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `main_drivers`
--
ALTER TABLE `main_drivers`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `main_roles`
--
ALTER TABLE `main_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `main_routes`
--
ALTER TABLE `main_routes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_vehicle` (`vehicle_id`);

--
-- Indices de la tabla `main_sends`
--
ALTER TABLE `main_sends`
  ADD PRIMARY KEY (`id`),
  ADD KEY `send_route` (`route_id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `user_send` (`user_id`);

--
-- Indices de la tabla `main_users`
--
ALTER TABLE `main_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_rol` (`rol_id`),
  ADD KEY `usr_email_index` (`email`);

--
-- Indices de la tabla `main_vehicles`
--
ALTER TABLE `main_vehicles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `main_drivers`
--
ALTER TABLE `main_drivers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `main_roles`
--
ALTER TABLE `main_roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `main_routes`
--
ALTER TABLE `main_routes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `main_sends`
--
ALTER TABLE `main_sends`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `main_users`
--
ALTER TABLE `main_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `main_vehicles`
--
ALTER TABLE `main_vehicles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `main_routes`
--
ALTER TABLE `main_routes`
  ADD CONSTRAINT `route_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `main_vehicles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `main_sends`
--
ALTER TABLE `main_sends`
  ADD CONSTRAINT `driver_id` FOREIGN KEY (`driver_id`) REFERENCES `main_drivers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `send_route` FOREIGN KEY (`route_id`) REFERENCES `main_routes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `user_send` FOREIGN KEY (`user_id`) REFERENCES `main_users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `main_users`
--
ALTER TABLE `main_users`
  ADD CONSTRAINT `id_rol` FOREIGN KEY (`rol_id`) REFERENCES `main_roles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;
