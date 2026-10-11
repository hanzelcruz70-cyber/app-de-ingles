#!/usr/bin/env bash
# Prueba las reglas de seguridad (RLS) de supabase/schema.sql en un Postgres local.
# Uso: PGURL="postgresql://postgres@127.0.0.1:5432/postgres" ./run.sh
# Crea una base temporal "pandi_rls_test", la llena con 2 escuelas y verifica permisos. Debe imprimir solo PASS.
set -e
cd "$(dirname "$0")"
PGURL=${PGURL:-postgresql://postgres@127.0.0.1:5432/postgres}
psql "$PGURL" -q -c "drop database if exists pandi_rls_test" -c "create database pandi_rls_test"
TEST_URL="${PGURL%/*}/pandi_rls_test"
psql "$PGURL" -q -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;" -c "do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;"
sed '1d' prelude.sql > /tmp/pandi_prelude.sql
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f /tmp/pandi_prelude.sql -f ../../supabase/schema.sql -f rls_test.sql 2>&1 | grep -oE "(PASS|FAIL) .*|ERROR.*"
