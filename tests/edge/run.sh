#!/usr/bin/env bash
# Prueba la función admin-users con un Supabase simulado (no necesita internet ni Deno).
set -e
cd "$(dirname "$0")"
sed "s#^import { createClient } from 'jsr:@supabase/supabase-js@2';#const createClient = null;#" ../../supabase/functions/admin-users/index.ts > index.mjs
node test.mjs
rm -f index.mjs
