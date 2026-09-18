-- ============================================================
-- PAE - Endurecimiento de seguridad de la base
-- ============================================================
-- Tres decisiones importantes:
--
-- 1. RLS SIN POLITICAS PARA EL ANON. El frontend nunca habla con
--    Supabase directamente: todo pasa por nuestro backend, que usa
--    la service_role key (esa llave ignora RLS por diseno). Con RLS
--    activo y cero politicas, la anon key no puede leer ni escribir
--    nada: aunque alguien consiga la anon key, no ve una sola fila.
--    Las politicas permisivas antiguas (using true) se eliminan.
--
-- 2. UNA RESERVA POR DOCUMENTO + FECHA + TURNO. La validacion que
--    hacia el backend (contar y despues insertar) deja pasar duplicados
--    si dos peticiones llegan al tiempo. La base ahora rechaza el
--    segundo insert siempre, sin importar el orden.
--
-- 3. INDICES para las consultas que corren todo el tiempo (reservas
--    por documento, por fecha, y el panel de cocina por fecha+sede).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Retirar todas las politicas permisivas anteriores.
--    RLS queda ACTIVO en todas las tablas pero sin politicas:
--    para la anon key eso significa "negar todo".
-- ------------------------------------------------------------
do $$
declare fila record;
begin
  for fila in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      fila.policyname, fila.schemaname, fila.tablename
    );
  end loop;
end $$;
