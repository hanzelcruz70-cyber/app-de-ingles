\set ON_ERROR_STOP 1
-- seed as superuser (like the service role / edge function)
insert into auth.users values ('a0000000-0000-0000-0000-00000000000a'),('a0000000-0000-0000-0000-000000000001'),('a0000000-0000-0000-0000-000000000002'),('a0000000-0000-0000-0000-000000000003'),('b0000000-0000-0000-0000-00000000000b'),('b0000000-0000-0000-0000-000000000001');
insert into schools(id,name) values ('aaaaaaaa-0000-0000-0000-000000000000','Escuela A'),('bbbbbbbb-0000-0000-0000-000000000000','Escuela B');
insert into profiles(id,school_id,role,username,name,group_id) values
 ('a0000000-0000-0000-0000-00000000000a','aaaaaaaa-0000-0000-0000-000000000000','admin','profe.a','Profe A',null),
 ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000000','student','ana','Ana','g1'),
 ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','student','sofia','Sofía','g1'),
 ('a0000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000000','student','mateo','Mateo','g2'),
 ('b0000000-0000-0000-0000-00000000000b','bbbbbbbb-0000-0000-0000-000000000000','admin','profe.b','Profe B',null),
 ('b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000000','student','tom','Tom','g1');
insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','{"xp":120,"xpDays":{},"days":[]}'),('a0000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000000','{"xp":50}');
insert into groups(school_id,id,name,open) values ('aaaaaaaa-0000-0000-0000-000000000000','g1','Sábados','{"u1":true}'),('bbbbbbbb-0000-0000-0000-000000000000','g1','B grupo','{}');

create or replace function pg_temp.check(label text, ok boolean) returns void language plpgsql as $$ begin raise notice '% %', case when ok then 'PASS' else 'FAIL' end, label; end $$;
create or replace function pg_temp.fails(sqltext text) returns boolean language plpgsql as $$ begin execute sqltext; return false; exception when others then return true; end $$;

-- ===== student Ana =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select pg_temp.check('1 estudiante solo ve su perfil', (select count(*) from profiles) = 1);
select pg_temp.check('2 ranking solo de su grupo (Ana+Sofía)', (select count(*) from class_ranking()) = 2 and (select max(xp) from class_ranking()) = 120);
select pg_temp.check('3 no lee progreso ajeno', (select count(*) from progress) = 0);
select pg_temp.check('4a guarda su propio progreso', not pg_temp.fails($q$insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000000','{"xp":10}')$q$));
select pg_temp.check('4b no puede escribir progreso de otro', pg_temp.fails($q$insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','{"xp":9999}') on conflict (user_id) do update set data = excluded.data$q$));
with u as (update groups set name='hack' returning 1) select pg_temp.check('5 no puede cambiar grupos', (select count(*) from u) = 0);
with u as (update profiles set group_id='g2' where id = auth.uid() returning 1) select pg_temp.check('6 no puede cambiarse de grupo', (select count(*) from u) = 0);
select pg_temp.check('6b no puede cambiarse el rol', pg_temp.fails($q$update profiles set role='admin' where id = auth.uid()$q$));
insert into submissions(school_id,assignment_id,user_id,text,sent_at,note,reviewed) values ('aaaaaaaa-0000-0000-0000-000000000000','a1','a0000000-0000-0000-0000-000000000001','I like cats.',current_date,'¡Perfecto! (yo)',true);
select pg_temp.check('7 no puede calificarse sola', (select note='' and not reviewed from submissions where user_id = auth.uid()));
select pg_temp.check('7b ve las tareas y unidades de su escuela', (select count(*) from groups) = 1);
select pg_temp.check('7c no puede borrar el curso', pg_temp.fails($q$insert into courses(school_id,data) values ('aaaaaaaa-0000-0000-0000-000000000000','{}')$q$));
commit;

-- ===== admin A =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select pg_temp.check('8 admin ve los 4 perfiles de su escuela', (select count(*) from profiles) = 4);
select pg_temp.check('8b admin ve progresos de su escuela', (select count(*) from progress) = 3);
with u as (update submissions set note='Muy bien', reviewed=true where assignment_id='a1' returning 1) select pg_temp.check('9 admin califica la escritura', (select count(*) from u) = 1);
select pg_temp.check('9b nota guardada', (select note from submissions where assignment_id='a1') = 'Muy bien');
with u as (update profiles set group_id='g2' where username='sofia' returning 1) select pg_temp.check('10 admin mueve estudiante de grupo', (select count(*) from u) = 1);
select pg_temp.check('11 admin no puede cambiar roles', pg_temp.fails($q$update profiles set role='admin' where username='ana'$q$));
select pg_temp.check('12 admin guarda el curso', not pg_temp.fails($q$insert into courses(school_id,data) values ('aaaaaaaa-0000-0000-0000-000000000000','{"units":[]}') on conflict (school_id) do update set data=excluded.data$q$));
select pg_temp.check('13 admin crea grupo y tarea', not pg_temp.fails($q$insert into groups(school_id,id,name) values ('aaaaaaaa-0000-0000-0000-000000000000','g2','Martes'); insert into assignments(school_id,id,title,due,lessons,groups) values ('aaaaaaaa-0000-0000-0000-000000000000','a1','Semana 1',current_date,'{u1l1}','{g1}')$q$));
select pg_temp.check('14 admin NO ve la otra escuela', (select count(*) from profiles where school_id='bbbbbbbb-0000-0000-0000-000000000000') = 0 and (select count(*) from groups where school_id='bbbbbbbb-0000-0000-0000-000000000000') = 0);
select pg_temp.check('15 admin NO escribe en la otra escuela', pg_temp.fails($q$insert into groups(school_id,id,name) values ('bbbbbbbb-0000-0000-0000-000000000000','gx','hack')$q$));
with u as (update progress set data='{}' returning 1) select pg_temp.check('15b admin NO cambia progreso de estudiantes', (select count(*) from u) = 0);
commit;

-- ===== Ana after review =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
with u as (update submissions set text='cambio' where user_id=auth.uid() returning 1) select pg_temp.check('16 no edita la escritura ya revisada', (select count(*) from u) = 0);
select pg_temp.check('16b ve la nota del profe', (select note from submissions where user_id=auth.uid()) = 'Muy bien');
select pg_temp.check('17 ranking tras mover a Sofía (solo Ana)', (select count(*) from class_ranking()) = 1);
commit;

-- ===== anonymous =====
begin; set local role anon;
select pg_temp.check('18 sin sesión no ve nada', pg_temp.fails('select * from profiles') and pg_temp.fails('select * from progress'));
commit;
